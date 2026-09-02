// supabase/functions/refund-payment/index.ts
//
// Admin-only. Refunds go through Paystack's server API (needs the secret
// key), then flips payments.status -> refunded and orders.status -> refunded.
// Staff cannot call this — refunds are admin-only per spec.
//
// NOTE: Helpers from _shared are inlined here on purpose so this file is
// self-contained and can be deployed from the Supabase Dashboard (which only
// uploads this single file and can't resolve ../_shared imports).

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

// ---------------------------------------------------------------------------
// Auth helpers (mirror _shared/auth.ts — keep in sync)
// ---------------------------------------------------------------------------

function serviceRoleClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

interface CallerProfile {
  id: string
  role: 'admin' | 'staff'
  status: 'active' | 'suspended'
  full_name: string
}

async function getCallerProfile(
  req: Request,
  admin: SupabaseClient,
): Promise<CallerProfile | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token)

  if (userError || !user) return null

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, status, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return null

  return profile as CallerProfile
}

function requireActiveAdmin(profile: CallerProfile | null): string | null {
  if (!profile) return 'Not authenticated.'
  if (profile.status !== 'active') return 'Account is suspended.'
  if (profile.role !== 'admin') return 'Admin access required.'
  return null
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

interface RefundPayload {
  order_id: string
  reason?: string
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse(req, 'Method not allowed', 405)

  const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is not set')
    return errorResponse(req, 'Refunds are not configured.', 500)
  }

  const db = serviceRoleClient()
  const caller = await getCallerProfile(req, db)
  const authError = requireActiveAdmin(caller)
  if (authError) return errorResponse(req, authError, 403)

  let payload: RefundPayload
  try {
    payload = await req.json()
  } catch {
    return errorResponse(req, 'Invalid JSON body')
  }

  const { order_id, reason } = payload
  if (!order_id) return errorResponse(req, 'order_id is required.')

  const { data: payment, error: paymentError } = await db
    .from('payments')
    .select('*')
    .eq('order_id', order_id)
    .eq('status', 'success')
    .single()

  if (paymentError || !payment) {
    return errorResponse(req, 'No successful payment found for this order.', 404)
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
    // Log the raw Paystack response server-side; never echo it to the client.
    console.error('Paystack refund failed', paystackBody)
    return errorResponse(req, 'Paystack refund request failed.', 502)
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
    return errorResponse(req, 'Refund was issued at Paystack but could not be recorded. Contact engineering.', 500)
  }

  const { data: order, error: orderUpdateError } = await db
    .from('orders')
    .update({ status: 'refunded', cancelled_reason: reason ?? null })
    .eq('id', order_id)
    .select()
    .single()

  if (orderUpdateError) {
    console.error('order refund status update failed', orderUpdateError)
    return errorResponse(req, 'Refund recorded on payment but order status update failed.', 500)
  }

  await db.rpc('log_staff_activity', {
    p_actor_id: caller!.id,
    p_action: 'order_refunded',
    p_target_table: 'orders',
    p_target_id: order_id,
    p_metadata: { reason: reason ?? null, reference: payment.reference },
  })

  return jsonResponse(req, { order, payment_reference: payment.reference })
})