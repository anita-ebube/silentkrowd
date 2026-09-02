// supabase/functions/create-staff/index.ts
//
// Admin-only. Creates a Supabase Auth user + profile row for a new staff
// member in one shot, with email confirmation disabled (per spec: no email
// verification for staff/admin accounts). Requires the caller's access token
// in the Authorization header so we can confirm they're an active admin
// before doing anything privileged.
//
// Error responses are deliberately generic (no "email already exists"
// messages) to avoid user enumeration.
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

interface CreateStaffPayload {
  full_name: string
  email: string
  phone?: string
  password: string
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse(req, 'Method not allowed', 405)

  const db = serviceRoleClient()
  const caller = await getCallerProfile(req, db)
  const authError = requireActiveAdmin(caller)
  if (authError) return errorResponse(req, authError, 403)

  let payload: CreateStaffPayload
  try {
    payload = await req.json()
  } catch {
    return errorResponse(req, 'Invalid JSON body')
  }

  const { full_name, email, phone, password } = payload

  if (!full_name?.trim() || full_name.trim().length > 120)
    return errorResponse(req, 'Full name is required and must be under 120 characters.')
  if (!email?.trim() || !EMAIL_RE.test(email.trim()))
    return errorResponse(req, 'A valid email address is required.')
  if (!password || password.length < 8 || password.length > 72)
    return errorResponse(req, 'Password must be between 8 and 72 characters.')

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true, // no email verification step for staff/admin accounts
  })

  if (createError || !created?.user) {
    // Generic message on purpose — never reveal whether the email already exists.
    console.error('auth.admin.createUser failed', createError)
    return errorResponse(req, 'Could not create staff account.', 400)
  }

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .insert({
      id: created.user.id,
      full_name: full_name.trim(),
      phone: phone?.trim() || null,
      role: 'staff',
      status: 'active',
      created_by: caller!.id,
    })
    .select()
    .single()

  if (profileError || !profile) {
    console.error('profile insert failed', profileError)
    // Roll back the auth user so we don't end up with an orphaned login with no profile.
    await db.auth.admin.deleteUser(created.user.id)
    return errorResponse(req, 'Could not create staff profile.', 500)
  }

  await db.rpc('log_staff_activity', {
    p_actor_id: caller!.id,
    p_action: 'staff_created',
    p_target_table: 'profiles',
    p_target_id: profile.id,
    p_metadata: { full_name: profile.full_name, email },
  })

  return jsonResponse(req, { profile })
})