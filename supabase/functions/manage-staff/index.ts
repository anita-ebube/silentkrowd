// supabase/functions/manage-staff/index.ts
//
// Admin-only. Single endpoint for the four privileged staff-account actions
// from the spec: suspend, activate, delete, reset-password. Kept as one
// function (dispatched by `action`) rather than four separate ones since
// they share the same auth-gate + target-lookup boilerplate.
//
// Scope is deliberately limited to accounts with role = 'staff' — this
// endpoint does not let an admin suspend/delete/reset another admin.
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

type Action = 'suspend' | 'activate' | 'delete' | 'reset-password'

interface ManageStaffPayload {
  action: Action
  staff_id: string
  new_password?: string // required when action === 'reset-password'
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse(req, 'Method not allowed', 405)

  const db = serviceRoleClient()
  const caller = await getCallerProfile(req, db)
  const authError = requireActiveAdmin(caller)
  if (authError) return errorResponse(req, authError, 403)

  let payload: ManageStaffPayload
  try {
    payload = await req.json()
  } catch {
    return errorResponse(req, 'Invalid JSON body')
  }

  const { action, staff_id, new_password } = payload

  if (!staff_id) return errorResponse(req, 'staff_id is required.')
  if (!['suspend', 'activate', 'delete', 'reset-password'].includes(action)) {
    return errorResponse(req, 'Unknown action.')
  }

  const { data: target, error: targetError } = await db
    .from('profiles')
    .select('id, role, status, full_name')
    .eq('id', staff_id)
    .single()

  if (targetError || !target) return errorResponse(req, 'Staff member not found.', 404)
  if (target.role !== 'staff') {
    return errorResponse(req, 'This endpoint can only manage staff accounts, not admins.', 403)
  }

  switch (action) {
    case 'suspend': {
      const { error } = await db.from('profiles').update({ status: 'suspended' }).eq('id', staff_id)
      if (error) return errorResponse(req, 'Could not suspend staff member.', 500)
      break
    }
    case 'activate': {
      const { error } = await db.from('profiles').update({ status: 'active' }).eq('id', staff_id)
      if (error) return errorResponse(req, 'Could not activate staff member.', 500)
      break
    }
    case 'delete': {
      // Deleting the auth user cascades to profiles (FK: profiles.id -> auth.users.id on delete cascade).
      const { error } = await db.auth.admin.deleteUser(staff_id)
      if (error) return errorResponse(req, 'Could not delete staff account.', 500)
      break
    }
    case 'reset-password': {
      if (!new_password || new_password.length < 8) {
        return errorResponse(req, 'new_password must be at least 8 characters.')
      }
      const { error } = await db.auth.admin.updateUserById(staff_id, { password: new_password })
      if (error) return errorResponse(req, 'Could not reset password.', 500)
      break
    }
  }

  await db.rpc('log_staff_activity', {
    p_actor_id: caller!.id,
    p_action: `staff_${action.replace('-', '_')}`,
    p_target_table: 'profiles',
    p_target_id: staff_id,
    p_metadata: { staff_name: target.full_name },
  })

  return jsonResponse(req, { success: true })
})