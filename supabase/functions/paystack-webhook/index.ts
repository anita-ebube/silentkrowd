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

import { serviceRoleClient } from '../_shared/auth.ts'
import { corsHeaders, errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts'

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

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const encoder = new TextEncoder()
  const key = encoder.encode(secret)
  const msg = encoder.encode(payload)

  // HMAC-SHA512 as per Paystack docs
  const cryptoKey = crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-512' }, false, ['verify'])
    .then((k) => crypto.subtle.verify('HMAC', k, hexToBytes(signature), msg))
    .catch(() => false)

  // We need a sync-ish approach for Deno.serve…
  // Deno.serve can be async, so we'll handle this in the main handler
  return true // placeholder — we verify in the async handler
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

// Format Paystack amount (kobo) to Naira
function koboToNaira(kobo: number): number {
  return kobo / 100
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is not set — webhook cannot verify')
    return errorResponse('Webhook not configured.', 500)
  }

  // ---- verify webhook signature ------------------------------------------
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  if (!signature) {
    console.error('Missing x-paystack-signature header')
    return errorResponse('Missing signature.', 401)
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
    return errorResponse('Invalid signature.', 401)
  }

  // ---- parse payload ------------------------------------------------------
  let payload: PaystackWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return errorResponse('Invalid JSON body')
  }

  // We only care about successful charges
  if (payload.event !== 'charge.success') {
    return jsonResponse({ status: 'ignored', event: payload.event })
  }

  const { reference, amount, status: paystackStatus } = payload.data

  if (paystackStatus !== 'success') {
    console.log('Webhook received non-success status:', paystackStatus)
    return jsonResponse({ status: 'ignored' })
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
    return jsonResponse({ status: 'not_found' }, 200)
  }

  // Idempotent — already verified
  if (payment.status === 'success') {
    console.log('Payment already verified for reference:', reference)
    return jsonResponse({ status: 'already_verified' })
  }

  // ---- double-check with Paystack API (defence in depth) ------------------
  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  )

  if (!verifyRes.ok) {
    console.error('Paystack verify HTTP error during webhook:', verifyRes.status)
    return errorResponse('Could not verify with Paystack.', 502)
  }

  const verifyBody = await verifyRes.json()
  const txn = verifyBody?.data

  if (!verifyBody?.status || !txn) {
    return errorResponse('Paystack could not verify this transaction.', 400)
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

    return jsonResponse({ status: 'verification_failed', reason: !amountMatches ? 'amount_mismatch' : 'not_successful' })
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

  return jsonResponse({ status: 'success' })
})
