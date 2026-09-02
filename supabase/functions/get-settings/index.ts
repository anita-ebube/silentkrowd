// supabase/functions/get-settings/index.ts
//
// Public endpoint (no auth required). Returns a whitelisted subset of the
// settings table — the parts customers need to see at checkout (delivery
// fee, restaurant name). The settings table itself is staff/admin-read-only
// via RLS, so we expose only these keys through this function.
//
// NOTE: Helpers from _shared are inlined here on purpose so this file is
// self-contained and can be deployed from the Supabase Dashboard (which only
// uploads this single file and can't resolve ../_shared imports).

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

function serviceRoleClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// ---- CORS (mirrors _shared/cors.ts — keep in sync) -----------------------

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

const PUBLIC_KEYS = ['delivery_fee', 'restaurant_name']

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'GET' && req.method !== 'POST') {
    return errorResponse(req, 'Method not allowed', 405)
  }

  const db = serviceRoleClient()

  const { data, error } = await db
    .from('settings')
    .select('key, value')
    .in('key', PUBLIC_KEYS)

  if (error) {
    console.error('get-settings failed', error)
    return errorResponse(req, 'Could not load settings.', 500)
  }

  const settings = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]))

  const rawFee = Number(settings.delivery_fee)

  return jsonResponse(req, {
    delivery_fee: Number.isFinite(rawFee) ? rawFee : 7000,
    restaurant_name:
      typeof settings.restaurant_name === 'string'
        ? settings.restaurant_name
        : 'SilentKrowd Lounge',
  })
})