import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/admin/login"
          element={
            <PageTransition>
              <AdminLogin />
            </PageTransition>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/admin"
            element={
              <PageTransition>
                <AdminDashboard />
              </PageTransition>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <PageTransition>
                <AdminOrders />
              </PageTransition>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <PageTransition>
                <AdminCustomers />
              </PageTransition>
            }
          />
          <Route
            path="/admin/reservations"
            element={
              <PageTransition>
                <AdminReservations />
              </PageTransition>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <PageTransition>
                <AdminMessages />
              </PageTransition>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute requireRole="admin">
                <PageTransition>
                  <AdminStaff />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requireRole="admin">
                <PageTransition>
                  <AdminSettings />
                </PageTransition>
              </ProtectedRoute>
            }
          />
        </Route>
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/menu"
            element={
              <PageTransition>
                <Menu />
              </PageTransition>
            }
          />
          <Route
            path="/reservations"
            element={
              <PageTransition>
                <Reservations />
              </PageTransition>
            }
          />
          <Route
            path="/gallery"
            element={
              <PageTransition>
                <Gallery />
              </PageTransition>
            }
          />
          <Route
            path="/contact"
            element={
              <PageTransition>
                <Contact />
              </PageTransition>
            }
          />
          <Route
            path="/order/success"
            element={
              <PageTransition>
                <OrderSuccess />
              </PageTransition>
            }
          />
          <Route
            path="/track-order"
            element={
              <PageTransition>
                <TrackOrder />
              </PageTransition>
            }
          />
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFound />
              </PageTransition>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
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
