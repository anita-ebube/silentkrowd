// supabase/functions/create-order/index.ts
//
// Public endpoint (no auth required — customers are guests). Called from the
// Checkout Modal after the customer fills in their details and before Paystack
// is opened. Creates/reuses the customer record, creates a pending_payment
// order + order_items + a pending payment row, and returns everything the
// frontend needs to open Paystack Inline.
//
// Pricing is looked up from the menu_items table (server-side source of truth)
// and NEVER trusted from client-sent unit_price values. If the menu table is
// unavailable, order creation fails closed rather than falling back to
// client-supplied prices.
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

interface ClientItem {
  menu_item_id: number
  quantity: number
  unit_price?: number  // ignored — price always resolved server-side
  name?: string        // ignored
  category?: string    // ignored
}

interface CheckoutPayload {
  full_name: string
  phone: string
  email?: string
  delivery_address: string
  delivery_instructions?: string
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
const MAX_LINE_ITEMS = 30
const MAX_QUANTITY = 99

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse(req, 'Method not allowed', 405)

  let payload: CheckoutPayload
  try {
    payload = await req.json()
  } catch {
    return errorResponse(req, 'Invalid JSON body')
  }

  const { full_name, phone, email, delivery_address, delivery_instructions, idempotency_key, items } =
    payload

  // ---- validation -----------------------------------------------------
  if (typeof full_name !== 'string' || !full_name.trim() || full_name.trim().length > 120)
    return errorResponse(req, 'A valid full name is required.')
  if (typeof phone !== 'string' || !phone.trim() || !PHONE_RE.test(phone.trim()))
    return errorResponse(req, 'A valid phone number is required.')
  if (typeof delivery_address !== 'string' || !delivery_address.trim() || delivery_address.trim().length > 500)
    return errorResponse(req, 'A valid delivery address is required.')
  if (delivery_instructions != null && (typeof delivery_instructions !== 'string' || delivery_instructions.length > 1000))
    return errorResponse(req, 'Delivery instructions are too long.')
  if (email != null && (typeof email !== 'string' || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)))
    return errorResponse(req, 'A valid email address is required.')
  if (!Array.isArray(items) || items.length === 0)
    return errorResponse(req, 'Cart is empty.')
  if (items.length > MAX_LINE_ITEMS)
    return errorResponse(req, `Cart cannot contain more than ${MAX_LINE_ITEMS} items.`)

  for (const item of items) {
    if (!item.menu_item_id || !Number.isInteger(item.menu_item_id)) {
      return errorResponse(req, 'One or more cart items is malformed.')
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      return errorResponse(req, `Item quantity must be a whole number between 1 and ${MAX_QUANTITY}.`)
    }
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

      return jsonResponse(req, {
        order_id: existingOrder.id,
        order_number: existingOrder.order_number,
        subtotal: existingOrder.subtotal,
        delivery_fee: existingOrder.delivery_fee,
        total_amount: existingOrder.total_amount,
        reference: existingPayment?.reference,
        idempotent: true,
      })
    }
  }

  // ---- resolve items server-side (fail closed) --------------------------
  const { data: menuRows, error: menuError } = await db
    .from('menu_items')
    .select('id, name, category, price')
    .eq('active', true)
    .in('id', [...new Set(items.map((i) => i.menu_item_id))])

  if (menuError || !menuRows || menuRows.length === 0) {
    // Never trust client-sent prices — refuse the order instead.
    console.error('menu_items unavailable — refusing order creation.', menuError?.message)
    return errorResponse(req, 'Menu data is unavailable. Please try again later.', 503)
  }

  const priceMap = new Map(menuRows.map((m) => [m.id, m]))

  for (const item of items) {
    const menuItem = priceMap.get(item.menu_item_id)
    if (!menuItem) return errorResponse(req, `Menu item ${item.menu_item_id} is not available for online ordering.`)
    if (Number(menuItem.price) <= 0) return errorResponse(req, `${menuItem.name} cannot be ordered online. Please ask server for price.`)
  }

  const resolvedItems: ResolvedItem[] = items.map((item) => {
    const m = priceMap.get(item.menu_item_id)!
    return {
      menu_item_id: item.menu_item_id,
      name: m.name,
      category: m.category,
      unit_price: Number(m.price),
      quantity: item.quantity,
    }
  })

  // ---- pricing ----------------------------------------------------------
  const subtotal = resolvedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

  const { data: feeRow } = await db.from('settings').select('value').eq('key', 'delivery_fee').single()
  const deliveryFee = typeof feeRow?.value === 'number' ? feeRow.value : 7000

  const totalAmount = subtotal + deliveryFee

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
    return errorResponse(req, 'Could not save customer details.', 500)
  }

  // ---- order number -------------------------------------------------------
  const { data: orderNumber, error: orderNumberError } = await db.rpc('generate_order_number')
  if (orderNumberError || !orderNumber) {
    console.error('generate_order_number failed', orderNumberError)
    return errorResponse(req, 'Could not generate order number.', 500)
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
      discount_amount: 0,
      total_amount: totalAmount,
      idempotency_key: idempotency_key || null,
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error('order insert failed', orderError)
    return errorResponse(req, 'Could not create order.', 500)
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
    return errorResponse(req, 'Could not save cart items.', 500)
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
    return errorResponse(req, 'Could not initialize payment.', 500)
  }

  return jsonResponse(req, {
    order_id: order.id,
    order_number: order.order_number,
    subtotal,
    delivery_fee: deliveryFee,
    total_amount: totalAmount,
    reference,
    idempotent: false,
  })
})