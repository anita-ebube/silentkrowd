// supabase/functions/paystack-webhook/index.ts
//
// Paystack webhook endpoint — called by Paystack's servers on charge.success
// events. Acts as a backup notification mechanism in case the user closes
// their browser before the client-side verifyPayment() call completes.
//
// Paystack sends the webhook with an x-paystack-signature header that we
// verify using the secret key before touching any data.
//
// Setup: add this URL to your Paystack dashboard → Settings → Webhooks:
//   https://[project].supabase.co/functions/v1/paystack-webhook
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

interface PaystackWebhookPayload {
  event: string
  data: {
    reference: string
    amount: number
    status: string
    gateway_response: string
    channel: string
    paid_at: string
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse(req, 'Method not allowed', 405)

  const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is not set — webhook cannot verify')
    return errorResponse(req, 'Webhook not configured.', 500)
  }

  // ---- verify webhook signature ------------------------------------------
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  if (!signature) {
    console.error('Missing x-paystack-signature header')
    return errorResponse(req, 'Missing signature.', 401)
  }

  const encoder = new TextEncoder()
  const key = encoder.encode(secretKey)
  const msg = encoder.encode(rawBody)

  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-512' }, false, ['verify'],
  )
  const isValid = await crypto.subtle.verify('HMAC', cryptoKey, hexToBytes(signature), msg)

  if (!isValid) {
    console.error('Invalid webhook signature')
    return errorResponse(req, 'Invalid signature.', 401)
  }

  // ---- parse payload ------------------------------------------------------
  let payload: PaystackWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return errorResponse(req, 'Invalid JSON body')
  }

  // We only care about successful charges
  if (payload.event !== 'charge.success') {
    return jsonResponse(req, { status: 'ignored', event: payload.event })
  }

  const { reference, amount, status: paystackStatus } = payload.data

  if (paystackStatus !== 'success') {
    console.log('Webhook received non-success status:', paystackStatus)
    return jsonResponse(req, { status: 'ignored' })
  }

  const db = serviceRoleClient()

  // ---- find payment record by reference -----------------------------------
  const { data: payment, error: paymentError } = await db
    .from('payments')
    .select('*')
    .eq('reference', reference)
    .maybeSingle()

  if (paymentError || !payment) {
    console.error('Payment record not found for reference:', reference)
    return jsonResponse(req, { status: 'not_found' }, 200)
  }

  // Idempotent — already verified
  if (payment.status === 'success') {
    console.log('Payment already verified for reference:', reference)
    return jsonResponse(req, { status: 'already_verified' })
  }

  // ---- double-check with Paystack API (defence in depth) ------------------
  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  )

  if (!verifyRes.ok) {
    console.error('Paystack verify HTTP error during webhook:', verifyRes.status)
    return errorResponse(req, 'Could not verify with Paystack.', 502)
  }

  const verifyBody = await verifyRes.json()
  const txn = verifyBody?.data

  if (!verifyBody?.status || !txn) {
    return errorResponse(req, 'Paystack could not verify this transaction.', 400)
  }

  const amountMatches = Number(txn.amount) === Math.round(Number(payment.amount) * 100)
  const isSuccessful = txn.status === 'success'

  if (!amountMatches || !isSuccessful) {
    await db
      .from('payments')
      .update({
        status: 'failed',
        gateway_response: txn.gateway_response ?? 'Webhook verification failed',
        raw_verification: txn,
      })
      .eq('id', payment.id)

    return jsonResponse(req, { status: 'verification_failed', reason: !amountMatches ? 'amount_mismatch' : 'not_successful' })
  }

  // ---- mark payment + order as success -----------------------------------
  await db
    .from('payments')
    .update({
      status: 'success',
      gateway_response: txn.gateway_response,
      channel: txn.channel,
      paid_at: txn.paid_at ?? new Date().toISOString(),
      raw_verification: txn,
    })
    .eq('id', payment.id)

  await db
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', payment.order_id)

  console.log(`Webhook: payment ${reference} verified, order ${payment.order_id} marked as paid`)

  return jsonResponse(req, { status: 'success' })
})