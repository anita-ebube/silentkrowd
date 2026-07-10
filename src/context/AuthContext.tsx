// src/context/AuthContext.tsx
//
// Covers Admin/Staff auth only — customers never authenticate (see spec).
// Wraps the Supabase session + the matching `profiles` row (role/status),
// since almost everything that cares about auth actually cares about role.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isStaff: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) {
      console.error('Failed to load profile', error)
      setProfile(null)
      return
    }
    setProfile(data as Profile)
  }

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      setSession(session)
      if (session?.user) await loadProfile(session.user.id)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        await loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    // Extra gate: a suspended staff member has valid credentials but should
    // not get in. We check right after sign-in and immediately sign back out
    // if the profile says suspended.
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single()

      if (freshProfile?.status === 'suspended') {
        await supabase.auth.signOut()
        return { error: 'This account has been suspended. Contact an administrator.' }
      }
    }

    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user.id)
  }

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' && profile?.status === 'active',
    isStaff: profile?.role === 'staff' && profile?.status === 'active',
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
