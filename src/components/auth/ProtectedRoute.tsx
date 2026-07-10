// src/components/auth/ProtectedRoute.tsx
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader } from '@/components/ui/Loader'

interface ProtectedRouteProps {
  children: ReactNode
  /** Omit to allow any authenticated, active admin or staff user. */
  requireRole?: 'admin' | 'staff'
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { session, profile, loading, isAdmin, isStaff } = useAuth()
  const location = useLocation()

  if (loading) return <Loader show />

  if (!session || !profile) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (profile.status === 'suspended') {
    return <Navigate to="/admin/login" state={{ suspended: true }} replace />
  }

  const hasAccess = requireRole === 'admin' ? isAdmin : requireRole === 'staff' ? isStaff || isAdmin : isAdmin || isStaff

  if (!hasAccess) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
