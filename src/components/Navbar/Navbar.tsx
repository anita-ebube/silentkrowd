import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { useCart } from '@/context/CartContext'
import logo from '@/assets/logo.png'

const links = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/reservations', label: 'Reserve' },
  { to: '/contact', label: 'Contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { totalCount, toggleCart } = useCart()

  useEffect(() => {
    let ticking = false
    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 40)
          ticking = false
        })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-[9000] transition-colors duration-500 ${
          scrolled ? 'bg-SilentKrowd-black/95 backdrop-blur-lg border-b border-SilentKrowd-border' : 'bg-transparent'
        }`}
      >
        <Container className="flex items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="SilentKrowd logo"
              className="h-20 w-auto max-h-20 object-contain transform scale-110 origin-left"
            />
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            {links.slice(1).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `relative py-2 text-[0.7rem] uppercase tracking-[0.15em] text-SilentKrowd-white transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:bg-SilentKrowd-gold after:transition-all after:duration-400 hover:text-SilentKrowd-gold ${
                    isActive ? 'after:w-full text-SilentKrowd-gold' : 'after:w-0 hover:after:w-full'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              aria-label="Open cart"
              onClick={toggleCart}
              className="relative p-1 text-SilentKrowd-white transition-colors hover:text-SilentKrowd-gold"
            >
              <ShoppingBag size={20} />
              {totalCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-SilentKrowd-gold text-[0.55rem] font-semibold text-SilentKrowd-black">
                  {totalCount}
                </span>
              )}
            </button>
          </div>

          <button
            aria-label="Open menu"
            className="text-SilentKrowd-white md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={26} />
          </button>
        </Container>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] flex items-center justify-center bg-SilentKrowd-black md:hidden"
          >
            <button
              aria-label="Close menu"
              className="absolute right-6 top-5 text-SilentKrowd-white"
              onClick={() => setMobileOpen(false)}
            >
              <X size={26} />
            </button>
            <div className="flex flex-col items-center gap-8">
              {links.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <NavLink
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="font-serif text-3xl text-SilentKrowd-white transition-colors hover:text-SilentKrowd-gold"
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
