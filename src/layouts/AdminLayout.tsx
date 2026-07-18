// src/layouts/AdminLayout.tsx
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Users, UserCog, Tag, Calendar, Mail, Settings as SettingsIcon, LogOut } from 'lucide-react'
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
  { to: '/admin/coupons', label: 'Coupons', icon: Tag, adminOnly: true },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon, adminOnly: true },
]

export function AdminLayout() {
  const { profile, isAdmin, signOut } = useAuth()

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="flex min-h-screen bg-SilentKrowd-black">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-SilentKrowd-border px-4 py-8">
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

      <main className="flex-1 overflow-x-hidden px-8 py-10">
        <Outlet />
      </main>
    </div>
  )
}
