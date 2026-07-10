// supabase/functions/refund-payment/index.ts
//
// Admin-only. Refunds go through Paystack's server API (needs the secret
// key), then flips payments.status -> refunded and orders.status -> refunded.
// Staff cannot call this — refunds are admin-only per spec.

import { getCallerProfile, requireActiveAdmin, serviceRoleClient } from '../_shared/auth.ts'
import { errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts'

interface RefundPayload {
  order_id: string
  reason?: string
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is not set')
    return errorResponse('Refunds are not configured.', 500)
  }

  const db = serviceRoleClient()
  const caller = await getCallerProfile(req, db)
  const authError = requireActiveAdmin(caller)
  if (authError) return errorResponse(authError, 403)

  let payload: RefundPayload
  try {
    payload = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  const { order_id, reason } = payload
  if (!order_id) return errorResponse('order_id is required.')

  const { data: payment, error: paymentError } = await db
    .from('payments')
    .select('*')
    .eq('order_id', order_id)
    .eq('status', 'success')
    .single()

  if (paymentError || !payment) {
    return errorResponse('No successful payment found for this order.', 404)
  }

  const paystackRes = await fetch('https://api.paystack.co/refund', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction: payment.reference,
      merchant_note: reason ?? 'Refund issued by admin',
    }),
  })

  const paystackBody = await paystackRes.json().catch(() => null)

  if (!paystackRes.ok || !paystackBody?.status) {
    console.error('Paystack refund failed', paystackBody)
    return errorResponse(paystackBody?.message ?? 'Paystack refund request failed.', 502)
  }

  const { error: paymentUpdateError } = await db
    .from('payments')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      refunded_by: caller!.id,
    })
    .eq('id', payment.id)

  if (paymentUpdateError) {
    console.error('payment refund update failed', paymentUpdateError)
    return errorResponse('Refund was issued at Paystack but could not be recorded. Contact engineering.', 500)
  }

  const { data: order, error: orderUpdateError } = await db
    .from('orders')
    .update({ status: 'refunded', cancelled_reason: reason ?? null })
    .eq('id', order_id)
    .select()
    .single()

  if (orderUpdateError) {
    console.error('order refund status update failed', orderUpdateError)
    return errorResponse('Refund recorded on payment but order status update failed.', 500)
  }

  await db.rpc('log_staff_activity', {
    p_actor_id: caller!.id,
    p_action: 'order_refunded',
    p_target_table: 'orders',
    p_target_id: order_id,
    p_metadata: { reason: reason ?? null, reference: payment.reference },
  })

  return jsonResponse({ order, payment_reference: payment.reference })
})
