// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly at startup rather than producing confusing "fetch failed"
  // errors deep inside some unrelated component later.
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

/**
 * Base URL for calling Edge Functions directly with fetch (used for the
 * public, no-auth endpoints like create-order/verify-payment where we don't
 * need supabase.functions.invoke's auth-header handling, but it works fine
 * either way — see src/services/functions.ts).
 */
export const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`
