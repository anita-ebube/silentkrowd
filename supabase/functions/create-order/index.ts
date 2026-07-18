// supabase/functions/create-order/index.ts
//
// Public endpoint (no auth required — customers are guests). Called from the
// Checkout Modal after the customer fills in their details and before Paystack
// is opened. Creates/reuses the customer record, creates a pending_payment
// order + order_items + a pending payment row, and returns everything the
// frontend needs to open Paystack Inline.
//
// Pricing is looked up from the menu_items table (server-side source of truth)
// rather than trusting client-sent unit_price values. If the table hasn't been
// created yet (migration 0012 not applied), falls back gracefully to trusting
// the client — log a warning so the operator knows the canonical table is
// missing.

import { serviceRoleClient } from '../_shared/auth.ts'
import { corsHeaders, errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts'

interface ClientItem {
  menu_item_id: number
  quantity: number
  unit_price?: number  // legacy — only used when menu_items table is absent
  name?: string        // legacy
  category?: string    // legacy
}

interface CheckoutPayload {
  full_name: string
  phone: string
  email?: string
  delivery_address: string
  delivery_instructions?: string
  coupon_code?: string
  idempotency_key?: string
  items: ClientItem[]
}

interface ResolvedItem {
  menu_item_id: number
  name: string
  category: string
  unit_price: number
  quantity: number
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

  const { full_name, phone, email, delivery_address, delivery_instructions, coupon_code, idempotency_key, items } =
    payload

  // ---- validation -----------------------------------------------------
  if (!full_name?.trim()) return errorResponse('Full name is required.')
  if (!phone?.trim() || !PHONE_RE.test(phone.trim()))
    return errorResponse('A valid phone number is required.')
  if (!delivery_address?.trim()) return errorResponse('Delivery address is required.')
  if (!Array.isArray(items) || items.length === 0)
    return errorResponse('Cart is empty.')

  for (const item of items) {
    if (!item.menu_item_id || !item.quantity) {
      return errorResponse('One or more cart items is malformed.')
    }
    if (item.quantity <= 0) return errorResponse('Item quantity must be positive.')
  }

  const db = serviceRoleClient()

  // ---- idempotency check ------------------------------------------------
  if (idempotency_key) {
    const { data: existingOrder } = await db
      .from('orders')
      .select('*')
      .eq('idempotency_key', idempotency_key)
      .maybeSingle()

    if (existingOrder) {
      const { data: existingPayment } = await db
        .from('payments')
        .select('reference')
        .eq('order_id', existingOrder.id)
        .maybeSingle()

      return jsonResponse({
        order_id: existingOrder.id,
        order_number: existingOrder.order_number,
        subtotal: existingOrder.subtotal,
        delivery_fee: existingOrder.delivery_fee,
        discount_amount: existingOrder.discount_amount,
        total_amount: existingOrder.total_amount,
        reference: existingPayment?.reference,
        idempotent: true,
      })
    }
  }

  // ---- resolve items (try DB lookup first, fall back to client prices) --
  let resolvedItems: ResolvedItem[]

  const { data: menuRows, error: menuError } = await db
    .from('menu_items')
    .select('id, name, category, price')
    .in('id', [...new Set(items.map((i) => i.menu_item_id))])

  if (menuError) {
    console.warn('menu_items table not available — falling back to client-sent prices.', menuError.message)
  }

  if (menuRows && menuRows.length > 0 && !menuError) {
    // ---- server-side price lookup (preferred) ---------------------------
    const priceMap = new Map(menuRows.map((m) => [m.id, m]))

    // Validate every item is in the table
    for (const item of items) {
      const menuItem = priceMap.get(item.menu_item_id)
      if (!menuItem) return errorResponse(`Menu item ${item.menu_item_id} not found.`)
      if (Number(menuItem.price) <= 0) return errorResponse(`${menuItem.name} cannot be ordered online. Please ask server for price.`)
    }

    resolvedItems = items.map((item) => {
      const m = priceMap.get(item.menu_item_id)!
      return {
        menu_item_id: item.menu_item_id,
        name: m.name,
        category: m.category,
        unit_price: Number(m.price),
        quantity: item.quantity,
      }
    })
  } else {
    // ---- fallback: trust client (legacy mode — migration not yet applied)
    console.warn('create-order: using client-sent prices because menu_items table is missing or empty.')
    for (const item of items) {
      if (!item.unit_price || item.unit_price <= 0) {
        return errorResponse(`Item ${item.menu_item_id} has no valid price.`)
      }
    }

    resolvedItems = items.map((item) => ({
      menu_item_id: item.menu_item_id,
      name: item.name || `Item ${item.menu_item_id}`,
      category: item.category || 'food',
      unit_price: item.unit_price!,
      quantity: item.quantity,
    }))
  }

  // ---- pricing ----------------------------------------------------------
  const subtotal = resolvedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

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
      idempotency_key: idempotency_key || null,
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error('order insert failed', orderError)
    return errorResponse('Could not create order.', 500)
  }

  // ---- order items ------------------------------------------------------
  const { error: itemsError } = await db.from('order_items').insert(
    resolvedItems.map((i) => ({
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
    await db.from('orders').delete().eq('id', order.id)
    return errorResponse('Could not save cart items.', 500)
  }

  if (couponId) {
    const { error: couponUsageError } = await db.rpc('increment_coupon_usage', {
      p_coupon_id: couponId,
    })
    if (couponUsageError) {
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
    idempotent: false,
  })
})
