import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { MenuItem } from '@/data/menu'

export interface CartLine extends MenuItem {
  qty: number
}

interface CartContextValue {
  lines: CartLine[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (item: MenuItem, qty?: number) => void
  updateQty: (id: number, delta: number) => void
  removeItem: (id: number) => void
  clearCart: () => void
  totalCount: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'SilentKrowd:cart'

function loadPersistedLines(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Corrupt or pre-schema-change cart data — start fresh rather than crash.
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => loadPersistedLines())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // Storage full or unavailable (private browsing, etc.) — cart still
      // works for the current tab session, it just won't survive a refresh.
    }
  }, [lines])

  const addItem = (item: MenuItem, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === item.id)
      if (existing) {
        return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + qty } : l))
      }
      return [...prev, { ...item, qty }]
    })
  }

  const updateQty = (id: number, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    )
  }

  const removeItem = (id: number) => setLines((prev) => prev.filter((l) => l.id !== id))

  const clearCart = () => setLines([])

  const totalCount = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines])
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.qty * l.price, 0), [lines])

  const value: CartContextValue = {
    lines,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    toggleCart: () => setIsOpen((v) => !v),
    addItem,
    updateQty,
    removeItem,
    clearCart,
    totalCount,
    subtotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
