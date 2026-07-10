// supabase/functions/create-order/index.ts
//
// Public endpoint (no auth required — customers are guests). Called from the
// Checkout Modal after the customer fills in their details and before Paystack
// is opened. Creates/reuses the customer record, creates a pending_payment
// order + order_items + a pending payment row, and returns everything the
// frontend needs to open Paystack Inline.
//
// Known trust boundary: menu prices currently live in the frontend's static
// src/data/menu.ts, not in the database, so this function has no independent
// source of truth to validate unit_price against — it trusts what the client
// sends for each line, then does its own arithmetic for subtotal/total so at
// least the totals can't be tampered with independently of the line items.
// If/when menu items move into a `menu_items` table, swap the trust step
// below (marked TODO) to look prices up server-side instead.

import { serviceRoleClient } from '../_shared/auth.ts'
import { corsHeaders, errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts'

interface CheckoutItem {
  menu_item_id: number
  name: string
  category: 'food' | 'drinks' | 'wine' | 'spirits' | 'desserts'
  unit_price: number
  quantity: number
}

interface CheckoutPayload {
  full_name: string
  phone: string
  email?: string
  delivery_address: string
  delivery_instructions?: string
  coupon_code?: string
  items: CheckoutItem[]
}

const PHONE_RE = /^\+?[0-9]{7,15}$/

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  let payload: CheckoutPayload
  try {
    payload = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  const { full_name, phone, email, delivery_address, delivery_instructions, coupon_code, items } =
    payload

  // ---- validation -----------------------------------------------------
  if (!full_name?.trim()) return errorResponse('Full name is required.')
  if (!phone?.trim() || !PHONE_RE.test(phone.trim()))
    return errorResponse('A valid phone number is required.')
  if (!delivery_address?.trim()) return errorResponse('Delivery address is required.')
  if (!Array.isArray(items) || items.length === 0)
    return errorResponse('Cart is empty.')

  for (const item of items) {
    if (!item.menu_item_id || !item.name || !item.unit_price || !item.quantity) {
      return errorResponse('One or more cart items is malformed.')
    }
    if (item.quantity <= 0) return errorResponse('Item quantity must be positive.')
    if (item.unit_price <= 0) return errorResponse('Item price must be positive.')
  }

  const db = serviceRoleClient()

  // ---- upsert guest customer -------------------------------------------
  const { data: customer, error: customerError } = await db
    .rpc('upsert_customer', {
      p_full_name: full_name.trim(),
      p_phone: phone.trim(),
      p_email: email?.trim() || null,
    })
    .single()

  if (customerError || !customer) {
    console.error('upsert_customer failed', customerError)
    return errorResponse('Could not save customer details.', 500)
  }

  // ---- pricing ----------------------------------------------------------
  // TODO: once menu_items exists in the DB, replace this with a lookup of
  // canonical unit_price per menu_item_id instead of trusting the client.
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

  const { data: feeRow } = await db.from('settings').select('value').eq('key', 'delivery_fee').single()
  const deliveryFee = typeof feeRow?.value === 'number' ? feeRow.value : 7000

  let discountAmount = 0
  let couponId: string | null = null

  if (coupon_code?.trim()) {
    const { data: coupon } = await db
      .from('coupons')
      .select('*')
      .eq('code', coupon_code.trim().toUpperCase())
      .eq('active', true)
      .maybeSingle()

    if (coupon) {
      const now = new Date()
      const withinWindow =
        (!coupon.starts_at || new Date(coupon.starts_at) <= now) &&
        (!coupon.expires_at || new Date(coupon.expires_at) >= now)
      const withinUsage = !coupon.usage_limit || coupon.times_used < coupon.usage_limit
      const meetsMinimum = subtotal >= Number(coupon.min_order_amount)

      if (withinWindow && withinUsage && meetsMinimum) {
        discountAmount =
          coupon.discount_type === 'percentage'
            ? (subtotal * Number(coupon.discount_value)) / 100
            : Number(coupon.discount_value)

        if (coupon.max_discount) {
          discountAmount = Math.min(discountAmount, Number(coupon.max_discount))
        }
        discountAmount = Math.min(discountAmount, subtotal)
        couponId = coupon.id
      }
    }
  }

  const totalAmount = Math.max(subtotal + deliveryFee - discountAmount, 0)

  // ---- order number -------------------------------------------------------
  const { data: orderNumber, error: orderNumberError } = await db.rpc('generate_order_number')
  if (orderNumberError || !orderNumber) {
    console.error('generate_order_number failed', orderNumberError)
    return errorResponse('Could not generate order number.', 500)
  }

  // ---- create order ---------------------------------------------------
  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: customer.id,
      status: 'pending_payment',
      delivery_address: delivery_address.trim(),
      delivery_instructions: delivery_instructions?.trim() || null,
      subtotal,
      delivery_fee: deliveryFee,
      coupon_id: couponId,
      discount_amount: discountAmount,
      total_amount: totalAmount,
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error('order insert failed', orderError)
    return errorResponse('Could not create order.', 500)
  }

  // ---- order items ------------------------------------------------------
  const { error: itemsError } = await db.from('order_items').insert(
    items.map((i) => ({
      order_id: order.id,
      menu_item_id: i.menu_item_id,
      name: i.name,
      category: i.category,
      unit_price: i.unit_price,
      quantity: i.quantity,
      line_total: i.unit_price * i.quantity,
    })),
  )

  if (itemsError) {
    console.error('order_items insert failed', itemsError)
    // Best-effort cleanup so we don't leave an order with no items behind.
    await db.from('orders').delete().eq('id', order.id)
    return errorResponse('Could not save cart items.', 500)
  }

  if (couponId) {
    const { error: couponUsageError } = await db.rpc('increment_coupon_usage', {
      p_coupon_id: couponId,
    })
    if (couponUsageError) {
      // Non-fatal: the order still succeeds even if the usage counter didn't tick up.
      console.error('increment_coupon_usage failed', couponUsageError)
    }
  }

  // ---- pending payment row ----------------------------------------------
  const reference = `SK-PAY-${order.order_number}-${crypto.randomUUID().slice(0, 8)}`

  const { error: paymentError } = await db.from('payments').insert({
    order_id: order.id,
    reference,
    amount: totalAmount,
    status: 'pending',
  })

  if (paymentError) {
    console.error('payment insert failed', paymentError)
    return errorResponse('Could not initialize payment.', 500)
  }

  return jsonResponse({
    order_id: order.id,
    order_number: order.order_number,
    subtotal,
    delivery_fee: deliveryFee,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    reference,
  })
})
