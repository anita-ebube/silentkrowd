// supabase/functions/manage-staff/index.ts
//
// Admin-only. Single endpoint for the four privileged staff-account actions
// from the spec: suspend, activate, delete, reset-password. Kept as one
// function (dispatched by `action`) rather than four separate ones since
// they share the same auth-gate + target-lookup boilerplate.
//
// Scope is deliberately limited to accounts with role = 'staff' — this
// endpoint does not let an admin suspend/delete/reset another admin.

import { getCallerProfile, requireActiveAdmin, serviceRoleClient } from '../_shared/auth.ts'
import { errorResponse, handleOptions, jsonResponse } from '../_shared/cors.ts'

type Action = 'suspend' | 'activate' | 'delete' | 'reset-password'

interface ManageStaffPayload {
  action: Action
  staff_id: string
  new_password?: string // required when action === 'reset-password'
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  const db = serviceRoleClient()
  const caller = await getCallerProfile(req, db)
  const authError = requireActiveAdmin(caller)
  if (authError) return errorResponse(authError, 403)

  let payload: ManageStaffPayload
  try {
    payload = await req.json()
  } catch {
    return errorResponse('Invalid JSON body')
  }

  const { action, staff_id, new_password } = payload

  if (!staff_id) return errorResponse('staff_id is required.')
  if (!['suspend', 'activate', 'delete', 'reset-password'].includes(action)) {
    return errorResponse('Unknown action.')
  }

  const { data: target, error: targetError } = await db
    .from('profiles')
    .select('id, role, status, full_name')
    .eq('id', staff_id)
    .single()

  if (targetError || !target) return errorResponse('Staff member not found.', 404)
  if (target.role !== 'staff') {
    return errorResponse('This endpoint can only manage staff accounts, not admins.', 403)
  }

  switch (action) {
    case 'suspend': {
      const { error } = await db.from('profiles').update({ status: 'suspended' }).eq('id', staff_id)
      if (error) return errorResponse('Could not suspend staff member.', 500)
      break
    }
    case 'activate': {
      const { error } = await db.from('profiles').update({ status: 'active' }).eq('id', staff_id)
      if (error) return errorResponse('Could not activate staff member.', 500)
      break
    }
    case 'delete': {
      // Deleting the auth user cascades to profiles (FK: profiles.id -> auth.users.id on delete cascade).
      const { error } = await db.auth.admin.deleteUser(staff_id)
      if (error) return errorResponse('Could not delete staff account.', 500)
      break
    }
    case 'reset-password': {
      if (!new_password || new_password.length < 8) {
        return errorResponse('new_password must be at least 8 characters.')
      }
      const { error } = await db.auth.admin.updateUserById(staff_id, { password: new_password })
      if (error) return errorResponse('Could not reset password.', 500)
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

  return jsonResponse({ success: true })
})
