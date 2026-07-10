// supabase/functions/verify-payment/index.ts
//
// Public endpoint (guests call this right after the Paystack popup closes).
// This is the ONLY place a payment is ever marked successful — the frontend
// callback from Paystack Inline is treated as untrusted; we always re-verify
// against Paystack's server using the secret key before touching the order.

import { serviceRoleClient } from '../_shared/auth.ts'
import { corsHeaders, errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts'

interface VerifyPayload {
  order_id: string
  reference: string
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is not set')
    return errorResponse('Payment verification is not configured.', 500)
  }

  let payload: VerifyPayload
  try {
    payload = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  const { order_id, reference } = payload
  if (!order_id || !reference) return errorResponse('order_id and reference are required.')

  const db = serviceRoleClient()

  const { data: payment, error: paymentError } = await db
    .from('payments')
    .select('*')
    .eq('order_id', order_id)
    .eq('reference', reference)
    .single()

  if (paymentError || !payment) return errorResponse('Payment record not found.', 404)

  // Already verified — idempotent short-circuit (handles double-calls, e.g.
  // the user refreshing the success page).
  if (payment.status === 'success') {
    const { data: order } = await db.from('orders').select('*').eq('id', order_id).single()
    return jsonResponse({ status: 'success', order })
  }

  // ---- call Paystack ------------------------------------------------------
  const paystackRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  )

  if (!paystackRes.ok) {
    console.error('Paystack verify HTTP error', paystackRes.status)
    return errorResponse('Could not reach Paystack for verification.', 502)
  }

  const paystackBody = await paystackRes.json()
  const txn = paystackBody?.data

  if (!paystackBody?.status || !txn) {
    return errorResponse('Paystack could not verify this transaction.', 400)
  }

  const amountMatches = Number(txn.amount) === Math.round(Number(payment.amount) * 100)
  const referenceMatches = txn.reference === reference
  const isSuccessful = txn.status === 'success'

  if (!referenceMatches) {
    console.error('Reference mismatch on verification', { expected: reference, got: txn.reference })
    return errorResponse('Payment reference mismatch.', 400)
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

    return jsonResponse({ status: 'failed', reason: !amountMatches ? 'amount_mismatch' : 'not_successful' }, 200)
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
    return errorResponse('Payment verified but could not be saved.', 500)
  }

  const { data: order, error: orderUpdateError } = await db
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', order_id)
    .select()
    .single()

  if (orderUpdateError) {
    console.error('order update failed', orderUpdateError)
    return errorResponse('Payment verified but order could not be updated.', 500)
  }

  return jsonResponse({ status: 'success', order })
})
