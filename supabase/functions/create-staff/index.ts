// supabase/functions/create-staff/index.ts
//
// Admin-only. Creates a Supabase Auth user + profile row for a new staff
// member in one shot, with email confirmation disabled (per spec: no email
// verification for staff/admin accounts). Requires the caller's access token
// in the Authorization header so we can confirm they're an active admin
// before doing anything privileged.

import { getCallerProfile, requireActiveAdmin, serviceRoleClient } from '../_shared/auth.ts'
import { errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts'

interface CreateStaffPayload {
  full_name: string
  email: string
  phone?: string
  password: string
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  const db = serviceRoleClient()
  const caller = await getCallerProfile(req, db)
  const authError = requireActiveAdmin(caller)
  if (authError) return errorResponse(authError, 403)

  let payload: CreateStaffPayload
  try {
    payload = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  const { full_name, email, phone, password } = payload

  if (!full_name?.trim()) return errorResponse('Full name is required.')
  if (!email?.trim()) return errorResponse('Email is required.')
  if (!password || password.length < 8)
    return errorResponse('Password must be at least 8 characters.')

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true, // no email verification step for staff/admin accounts
  })

  if (createError || !created?.user) {
    console.error('auth.admin.createUser failed', createError)
    return errorResponse(createError?.message ?? 'Could not create staff account.', 400)
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
    return errorResponse('Could not create staff profile.', 500)
  }

  await db.rpc('log_staff_activity', {
    p_actor_id: caller!.id,
    p_action: 'staff_created',
    p_target_table: 'profiles',
    p_target_id: profile.id,
    p_metadata: { full_name: profile.full_name, email },
  })

  return jsonResponse({ profile })
})
