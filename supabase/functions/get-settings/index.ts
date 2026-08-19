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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function handleOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status)
}

const PUBLIC_KEYS = ['delivery_fee', 'restaurant_name']

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'GET' && req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  const db = serviceRoleClient()

  const { data, error } = await db
    .from('settings')
    .select('key, value')
    .in('key', PUBLIC_KEYS)

  if (error) {
    console.error('get-settings failed', error)
    return errorResponse('Could not load settings.', 500)
  }

  const settings = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]))

  const rawFee = Number(settings.delivery_fee)

  return jsonResponse({
    delivery_fee: Number.isFinite(rawFee) ? rawFee : 7000,
    restaurant_name:
      typeof settings.restaurant_name === 'string'
        ? settings.restaurant_name
        : 'SilentKrowd Lounge',
  })
})
