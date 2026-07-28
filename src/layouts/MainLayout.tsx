import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar/Navbar'
import { Footer } from '@/components/Footer/Footer'
import { Cursor } from '@/components/ui/Cursor'
import { CartDrawer } from '@/components/ui/CartDrawer'
import { useLenis } from '@/hooks/useLenis'
import { useEffect } from 'react'

export function MainLayout() {
  useLenis()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Cursor />
      <Navbar />
      <motion.main
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.main>
      <Footer />
      <CartDrawer />
    </>
  )
}
