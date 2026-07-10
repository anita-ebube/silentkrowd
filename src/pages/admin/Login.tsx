// src/pages/admin/Login.tsx
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { session, profile, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const suspendedNotice = (location.state as { suspended?: boolean } | null)?.suspended

  if (!loading && session && profile) {
    const redirectTo = (location.state as { from?: Location } | null)?.from?.pathname ?? '/admin'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signInError } = await signIn(email.trim(), password)

    setSubmitting(false)
    if (signInError) {
      setError(signInError)
      return
    }
    navigate('/admin', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center bg-SilentKrowd-black">
      <Container className="max-w-md">
        <h1 className="mb-2 font-serif text-3xl text-SilentKrowd-gold">Staff &amp; Admin Sign In</h1>
        <p className="mb-10 text-sm text-white/50">SilentKrowd Lounge internal access</p>

        {suspendedNotice && (
          <p className="mb-6 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            That account has been suspended. Contact an administrator.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs uppercase tracking-[0.15em] text-white/50">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-white/15 bg-transparent px-4 py-3 text-white outline-none focus:border-SilentKrowd-gold/60"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs uppercase tracking-[0.15em] text-white/50">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-white/15 bg-transparent px-4 py-3 text-white outline-none focus:border-SilentKrowd-gold/60"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" variant="filled" className="mt-2 justify-center">
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </Container>
    </div>
  )
}
