import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Loader, PageLoader } from '@/components/ui/Loader'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

const Home = lazy(() => import('@/pages/Home'))
const Menu = lazy(() => import('@/pages/Menu'))
const Reservations = lazy(() => import('@/pages/Reservations'))
const Gallery = lazy(() => import('@/pages/Gallery'))
const Contact = lazy(() => import('@/pages/Contact'))
const OrderSuccess = lazy(() => import('@/pages/OrderSuccess'))
const TrackOrder = lazy(() => import('@/pages/TrackOrder'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const AdminLogin = lazy(() => import('@/pages/admin/Login'))
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminOrders = lazy(() => import('@/pages/admin/Orders'))
const AdminCustomers = lazy(() => import('@/pages/admin/Customers'))
const AdminStaff = lazy(() => import('@/pages/admin/Staff'))
const AdminSettings = lazy(() => import('@/pages/admin/Settings'))
const AdminReservations = lazy(() => import('@/pages/admin/Reservations'))
const AdminMessages = lazy(() => import('@/pages/admin/Messages'))
const AdminGallery = lazy(() => import('@/pages/admin/Gallery'))
const AdminMenu = lazy(() => import('@/pages/admin/Menu'))

function AnimatedRoutes() {
  return (
    <Routes>
      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/reservations" element={<AdminReservations />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/admin/gallery" element={<AdminGallery />} />
        <Route path="/admin/menu" element={<AdminMenu />} />
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminSettings />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/order/success" element={<OrderSuccess />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AuthProvider>
      <Loader show={loading} />
      <Suspense fallback={<PageLoader />}>
        <AnimatedRoutes />
      </Suspense>
    </AuthProvider>
  )
}
