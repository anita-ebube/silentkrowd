// src/layouts/AdminLayout.tsx
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Users, UserCog, Calendar, Mail, Settings as SettingsIcon, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/reservations', label: 'Reservations', icon: Calendar },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/staff', label: 'Staff', icon: UserCog, adminOnly: true },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon, adminOnly: true },
]

export function AdminLayout() {
  const { profile, isAdmin, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="flex min-h-screen bg-SilentKrowd-black">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile hamburger toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-50 rounded-md border border-SilentKrowd-border bg-SilentKrowd-charcoal p-2 text-SilentKrowd-white md:hidden"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-SilentKrowd-border bg-SilentKrowd-black px-4 py-8 transition-transform duration-300 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-10 px-3">
          <p className="font-serif text-xl text-SilentKrowd-gold">SilentKrowd Luxury</p>
          <p className="text-xs uppercase tracking-[0.15em] text-SilentKrowd-muted">
            {isAdmin ? 'Admin Panel' : 'Staff Panel'}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {visibleItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-SilentKrowd-gold/10 text-SilentKrowd-gold'
                    : 'text-SilentKrowd-muted hover:bg-white/5 hover:text-SilentKrowd-white',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-SilentKrowd-border pt-4">
          <p className="mb-3 truncate px-3 text-sm text-SilentKrowd-white">{profile?.full_name}</p>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm text-SilentKrowd-muted transition-colors hover:bg-white/5 hover:text-SilentKrowd-white"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-4 pt-16 md:px-8 md:pt-10">
        <Outlet />
      </main>
    </div>
  )
}
