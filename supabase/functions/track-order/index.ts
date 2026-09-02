// supabase/functions/track-order/index.ts
//
// Public endpoint (guests track their own order). Replaces direct RLS-RPC
// access to track_order, which was brute-forceable because order numbers are
// a 10,000-value daily sequence. This function adds per-IP and per-phone
// rate limiting before looking the order up.
//
// Returns only the safe, simplified order shape (same as the track_order RPC).
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

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS_PER_KEY = 10
const PRUNE_OLDER_THAN_MS = 2 * 60 * 60 * 1000 // 2 hours

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse(req, 'Method not allowed', 405)

  let payload: { order_number?: string; phone?: string }
  try {
    payload = await req.json()
  } catch {
    return errorResponse(req, 'Invalid JSON body')
  }

  const orderNumber = typeof payload.order_number === 'string' ? payload.order_number.trim() : ''
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : ''

  if (!orderNumber || orderNumber.length > 30) {
    return errorResponse(req, 'A valid order number is required.')
  }
  if (!phone || phone.length > 20) {
    return errorResponse(req, 'A valid phone number is required.')
  }

  const db = serviceRoleClient()

  // Opportunistic cleanup of stale attempts.
  await db
    .from('rate_limit_attempts')
    .delete()
    .lt('attempted_at', new Date(Date.now() - PRUNE_OLDER_THAN_MS).toISOString())

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown'
  const keys = [`ip:${ip}`, `phone:${phone}`]
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  for (const key of keys) {
    const { count, error } = await db
      .from('rate_limit_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('bucket', 'track_order')
      .eq('key', key)
      .gte('attempted_at', since)

    if (error) {
      console.error('rate limit check failed', error)
      return errorResponse(req, 'Could not look up order.', 500)
    }
    if ((count ?? 0) >= MAX_ATTEMPTS_PER_KEY) {
      return errorResponse(req, 'Too many lookups. Please try again later.', 429)
    }
  }

  const { data, error } = await db.rpc('track_order', {
    p_order_number: orderNumber,
    p_phone: phone,
  })

  // Record the attempt (before returning, so failures also count).
  await db.from('rate_limit_attempts').insert(
    keys.map((key) => ({ bucket: 'track_order', key })),
  )

  if (error) {
    console.error('track_order failed', error)
    return errorResponse(req, 'Could not look up order.', 500)
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>
  if (rows.length === 0) {
    return jsonResponse(req, { found: false })
  }

  return jsonResponse(req, { found: true, order: rows[0] })
})