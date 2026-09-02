// supabase/functions/verify-payment/index.ts
//
// Public endpoint (guests call this right after the Paystack popup closes).
// This is the ONLY place a payment is ever marked successful — the frontend
// callback from Paystack Inline is treated as untrusted; we always re-verify
// against Paystack's server using the secret key before touching the order.
//
// Security note: only a safe subset of the order is returned to the caller —
// the full order row (delivery address, items) is never echoed back.
//
// NOTE: Helpers from _shared are inlined here on purpose so this file is
// self-contained and can be deployed from the Supabase Dashboard (which only
// uploads this single file and can't resolve ../_shared imports).

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

// ---------------------------------------------------------------------------
// Service-role client (mirror _shared/auth.ts — keep in sync)
// ---------------------------------------------------------------------------

function serviceRoleClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// ---------------------------------------------------------------------------
// CORS helpers (mirror _shared/cors.ts — keep in sync)
// ---------------------------------------------------------------------------

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://silentkrowd.com',
  'https://www.silentkrowd.com',
]

function getAllowedOrigins(): string[] {
  const env = Deno.env.get('CORS_ALLOWED_ORIGINS')
  if (env) {
    const list = env
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (list.length > 0) return list
  }
  return DEFAULT_ALLOWED_ORIGINS
}

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
  if (origin && getAllowedOrigins().includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Vary'] = 'Origin'
  }
  return headers
}

function handleOptions(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null
  const headers = buildCorsHeaders(req)
  if (!headers['Access-Control-Allow-Origin']) {
    return new Response('Origin not allowed', { status: 403 })
  }
  return new Response('ok', { headers })
}

function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
  })
}

function errorResponse(req: Request, message: string, status = 400): Response {
  return jsonResponse(req, { error: message }, status)
}

// ---------------------------------------------------------------------------

interface VerifyPayload {
  order_id: string
  reference: string
}

interface SafeOrder {
  id: string
  order_number: string
  status: string
  total_amount: number
}

function toSafeOrder(order: Record<string, unknown> | null): SafeOrder | null {
  if (!order) return null
  return {
    id: String(order.id ?? ''),
    order_number: String(order.order_number ?? ''),
    status: String(order.status ?? ''),
    total_amount: Number(order.total_amount ?? 0),
  }
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse(req, 'Method not allowed', 405)

  const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is not set')
    return errorResponse(req, 'Payment verification is not configured.', 500)
  }

  let payload: VerifyPayload
  try {
    payload = await req.json()
  } catch {
    return errorResponse(req, 'Invalid JSON body')
  }

  const { order_id, reference } = payload
  if (!order_id || !reference) return errorResponse(req, 'order_id and reference are required.')
  if (typeof order_id !== 'string' || typeof reference !== 'string' || reference.length > 200)
    return errorResponse(req, 'Invalid parameters.')

  const db = serviceRoleClient()

  const { data: payment, error: paymentError } = await db
    .from('payments')
    .select('*')
    .eq('order_id', order_id)
    .eq('reference', reference)
    .single()

  if (paymentError || !payment) return errorResponse(req, 'Payment record not found.', 404)

  // Already verified — idempotent short-circuit (handles double-calls, e.g.
  // the user refreshing the success page).
  if (payment.status === 'success') {
    const { data: order } = await db.from('orders').select('*').eq('id', order_id).single()
    return jsonResponse(req, { status: 'success', order: toSafeOrder(order) })
  }

  // The paystack-webhook may have just processed this payment but the DB
  // read above raced ahead of it. Poll a few times with short delays to
  // give the webhook a chance, avoiding an expensive Paystack API call.
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 400))
    const { data: refreshed } = await db
      .from('payments')
      .select('status')
      .eq('id', payment.id)
      .maybeSingle()
    if (refreshed?.status === 'success') {
      const { data: order } = await db.from('orders').select('*').eq('id', order_id).single()
      return jsonResponse(req, { status: 'success', order: toSafeOrder(order) })
    }
  }

  // ---- call Paystack ------------------------------------------------------
  const paystackRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  )

  if (!paystackRes.ok) {
    console.error('Paystack verify HTTP error', paystackRes.status)
    return errorResponse(req, 'Could not reach Paystack for verification.', 502)
  }

  const paystackBody = await paystackRes.json()
  const txn = paystackBody?.data

  if (!paystackBody?.status || !txn) {
    return errorResponse(req, 'Paystack could not verify this transaction.', 400)
  }

  const amountMatches = Number(txn.amount) === Math.round(Number(payment.amount) * 100)
  const referenceMatches = txn.reference === reference
  const isSuccessful = txn.status === 'success'

  if (!referenceMatches) {
    console.error('Reference mismatch on verification', { expected: reference, got: txn.reference })
    return errorResponse(req, 'Payment reference mismatch.', 400)
  }

  if (!isSuccessful || !amountMatches) {
    await db
      .from('payments')
      .update({
        status: 'failed',
        gateway_response: txn.gateway_response ?? 'Verification failed',
        raw_verification: txn,
      })
      .eq('id', payment.id)

    return jsonResponse(req, { status: 'failed', reason: !amountMatches ? 'amount_mismatch' : 'not_successful' }, 200)
  }

  // ---- success: update payment + order atomically enough for this scale --
  const { error: updatePaymentError } = await db
    .from('payments')
    .update({
      status: 'success',
      gateway_response: txn.gateway_response,
      channel: txn.channel,
      paid_at: txn.paid_at ?? new Date().toISOString(),
      raw_verification: txn,
    })
    .eq('id', payment.id)

  if (updatePaymentError) {
    console.error('payment update failed', updatePaymentError)
    return errorResponse(req, 'Payment verified but could not be saved.', 500)
  }

  const { data: order, error: orderUpdateError } = await db
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', order_id)
    .select()
    .single()

  if (orderUpdateError) {
    console.error('order update failed', orderUpdateError)
    return errorResponse(req, 'Payment verified but order could not be updated.', 500)
  }

  return jsonResponse(req, { status: 'success', order: toSafeOrder(order) })
})