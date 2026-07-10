import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Every Edge Function creates its own service-role client (full DB access,
 * bypasses RLS) — that's what lets these functions do privileged work like
 * auth.admin.createUser or writing orders/payments on a guest's behalf.
 * The service role key never reaches the frontend; it only exists as an
 * environment variable on the Edge Function runtime.
 */
export function serviceRoleClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export interface CallerProfile {
  id: string
  role: 'admin' | 'staff'
  status: 'active' | 'suspended'
  full_name: string
}

/**
 * Resolves the calling user's profile from the Authorization header on the
 * incoming request. Returns null if there's no valid session — callers
 * decide whether that's fatal for their endpoint.
 */
export async function getCallerProfile(
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

/** Throws-by-return-value helper for the common "must be an active admin" gate. */
export function requireActiveAdmin(profile: CallerProfile | null): string | null {
  if (!profile) return 'Not authenticated.'
  if (profile.status !== 'active') return 'Account is suspended.'
  if (profile.role !== 'admin') return 'Admin access required.'
  return null
}
