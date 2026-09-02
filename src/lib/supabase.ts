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

/**
 * Session storage backed by a Secure, SameSite=Lax cookie instead of
 * localStorage. Keeps the session out of localStorage (which any XSS can read
 * without restriction); falls back to localStorage only when a session is too
 * large to fit in a cookie (~4 KB), and migrates back automatically.
 *
 * Note: true HttpOnly cookies require Supabase Auth on your own custom domain
 * (dashboard-level config). This adapter is the strongest client-side option
 * available to a Vite SPA.
 */

const MAX_COOKIE_BYTES = 3500

function cookieKeyFor(storageKey: string): string {
  return storageKey.replace(/[^a-zA-Z0-9]/g, '_')
}

function readCookie(name: string): string | null {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${esc}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string): void {
  // 30-day session lifetime; refresh tokens renew it as long as the app is used.
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Secure; Max-Age=${60 * 60 * 24 * 30}`
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; Path=/; SameSite=Lax; Secure; Max-Age=0`
}

const cookieSessionStorage: Storage = {
  getItem(key: string): string | null {
    const cookieValue = readCookie(cookieKeyFor(key))
    if (cookieValue !== null) return cookieValue

    // Oversized session previously parked in localStorage — migrate back
    // if it now fits in a cookie.
    try {
      const lsValue = localStorage.getItem(key)
      if (lsValue !== null) {
        if (lsValue.length <= MAX_COOKIE_BYTES) {
          writeCookie(cookieKeyFor(key), lsValue)
          localStorage.removeItem(key)
        }
        return lsValue
      }
    } catch {
      // ignore storage errors
    }
    return null
  },
  setItem(key: string, value: string): void {
    if (value.length <= MAX_COOKIE_BYTES) {
      writeCookie(cookieKeyFor(key), value)
      try {
        localStorage.removeItem(key)
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.setItem(key, value)
      } catch {
        // ignore
      }
    }
  },
  removeItem(key: string): void {
    clearCookie(cookieKeyFor(key))
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  },
  get length(): number {
    return 0
  },
  clear(): void {
    // no-op — we only ever manage the one session key
  },
  key(): string | null {
    return null
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: cookieSessionStorage,
  },
})

/**
 * Base URL for calling Edge Functions directly with fetch (used for the
 * public, no-auth endpoints like create-order/verify-payment where we don't
 * need supabase.functions.invoke's auth-header handling, but it works fine
 * either way — see src/services/functions.ts).
 */
export const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`