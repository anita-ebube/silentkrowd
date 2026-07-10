import { Outlet, useLocation } from 'react-router-dom'
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
      <main>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}
