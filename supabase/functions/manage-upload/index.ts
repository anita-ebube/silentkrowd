// supabase/functions/manage-upload/index.ts
//
// Admin-only. The single place image files enter or leave public storage.
//   - action=upload  (multipart/form-data): validates MIME type + magic bytes,
//     enforces a size cap, generates a random UUID filename, uploads, and
//     logs the action. Rejects HTML/SVG/executables and any file whose content
//     does not match its declared type.
//   - action=delete  (application/json): removes a previously uploaded object
//     (path extracted server-side from its public URL — never trusted from the
//     client), then logs the action.
//
// Both actions require an active admin session.
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

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB hard cap server-side

interface MimeRule {
  ext: string
  matches: (b: Uint8Array) => boolean
}

const ALLOWED_MIME: Record<string, MimeRule> = {
  'image/jpeg': {
    ext: 'jpg',
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  'image/png': {
    ext: 'png',
    matches: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  'image/webp': {
    ext: 'webp',
    matches: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50, // WEBP
  },
  'image/gif': {
    ext: 'gif',
    matches: (b) =>
      b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38, // GIF8
  },
}

const ALLOWED_BUCKETS: Record<string, { folder: string }> = {
  'menu-images': { folder: 'menu' },
  'gallery-images': { folder: 'gallery' },
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  if (req.method !== 'POST') return errorResponse(req, 'Method not allowed', 405)

  const db = serviceRoleClient()
  const caller = await getCallerProfile(req, db)
  const authError = requireActiveAdmin(caller)
  if (authError) return errorResponse(req, authError, 403)

  const contentType = req.headers.get('content-type') ?? ''

  // ---- upload (multipart) ------------------------------------------------
  if (contentType.includes('multipart/form-data')) {
    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return errorResponse(req, 'Invalid multipart body')
    }

    const file = form.get('file')
    const bucket = form.get('bucket')

    if (!(file instanceof File)) return errorResponse(req, 'No file uploaded.')
    if (typeof bucket !== 'string' || !(bucket in ALLOWED_BUCKETS)) {
      return errorResponse(req, 'Invalid bucket.')
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return errorResponse(req, 'Image must be between 1 byte and 2 MB.')
    }

    const rule = ALLOWED_MIME[file.type]
    if (!rule) {
      return errorResponse(req, 'Unsupported file type. Only JPEG, PNG, WebP and GIF images are allowed.')
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    if (bytes.length < 12 || !rule.matches(bytes)) {
      return errorResponse(req, 'File content does not match its declared type.')
    }

    const folder = ALLOWED_BUCKETS[bucket].folder
    const path = `${folder}/${crypto.randomUUID()}.${rule.ext}`

    const { error: uploadError } = await db.storage
      .from(bucket)
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('storage upload failed', uploadError)
      return errorResponse(req, 'Upload failed.', 500)
    }

    const { data: urlData } = db.storage.from(bucket).getPublicUrl(path)

    await db.rpc('log_staff_activity', {
      p_actor_id: caller!.id,
      p_action: 'image_uploaded',
      p_target_table: bucket,
      p_target_id: null,
      p_metadata: { path, mime: file.type, size: file.size },
    })

    return jsonResponse(req, { path, url: urlData.publicUrl })
  }

  // ---- delete (json) -----------------------------------------------------
  let payload: { action?: string; bucket?: string; url?: string }
  try {
    payload = await req.json()
  } catch {
    return errorResponse(req, 'Invalid JSON body')
  }

  if (payload.action !== 'delete') {
    return errorResponse(req, 'Unknown action.')
  }

  const { bucket, url } = payload
  if (typeof bucket !== 'string' || !(bucket in ALLOWED_BUCKETS)) {
    return errorResponse(req, 'Invalid bucket.')
  }
  if (typeof url !== 'string') return errorResponse(req, 'url is required.')

  // Extract the object path from the public URL server-side.
  let path: string
  try {
    const parsed = new URL(url)
    const marker = `/object/public/${bucket}/`
    const idx = parsed.pathname.indexOf(marker)
    if (idx === -1) return errorResponse(req, 'Invalid object URL.')
    path = parsed.pathname.slice(idx + marker.length)
  } catch {
    return errorResponse(req, 'Invalid object URL.')
  }

  const folder = ALLOWED_BUCKETS[bucket].folder
  if (!path || !path.startsWith(folder + '/') || path.includes('..')) {
    return errorResponse(req, 'Invalid object path.')
  }

  const { error: removeError } = await db.storage.from(bucket).remove([path])
  if (removeError) {
    console.error('storage remove failed', removeError)
    return errorResponse(req, 'Could not delete image.', 500)
  }

  await db.rpc('log_staff_activity', {
    p_actor_id: caller!.id,
    p_action: 'image_deleted',
    p_target_table: bucket,
    p_target_id: null,
    p_metadata: { path },
  })

  return jsonResponse(req, { success: true })
})