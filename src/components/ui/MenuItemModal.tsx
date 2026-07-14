import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { useCart } from '@/context/CartContext'
import type { MenuItem } from '@/data/menu'

export function MenuItemModal({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const [qty, setQty] = useState(1)
  const { addItem } = useCart()

  function handleAdd() {
    if (!item) return
    addItem(item, qty)
    setQty(1)
    onClose()
  }

  return (
    <Modal open={!!item} onClose={onClose}>
      {item && (
        <div className="grid grid-cols-1 overflow-hidden rounded-sm bg-SilentKrowd-charcoal md:grid-cols-2">
          <div className="relative h-[50vh] md:h-[80vh]">
            <img
              src={item.img}
              alt={item.name}
              className="h-full w-full object-cover brightness-50 contrast-110 saturate-75"
            />
          </div>
          <div className="flex flex-col justify-center p-8 md:p-12">
            <span className="mb-2 inline-block border border-SilentKrowd-gold/20 px-3 py-1 text-[0.55rem] uppercase tracking-wider text-SilentKrowd-gold/60">
              {item.category}
            </span>
            <h2 className="mb-2 font-serif text-3xl text-SilentKrowd-white md:text-4xl">{item.name}</h2>
            <span className="mb-6 font-serif text-2xl text-SilentKrowd-gold">${item.price}</span>
            <div className="mt-auto flex items-center gap-4 pt-6">
              <div className="flex items-center rounded-sm border border-SilentKrowd-border">
                <button
                  className="flex h-10 w-10 items-center justify-center text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="w-10 text-center text-sm text-SilentKrowd-white">{qty}</span>
                <button
                  className="flex h-10 w-10 items-center justify-center text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white"
                  onClick={() => setQty((q) => Math.min(20, q + 1))}
                >
                  +
                </button>
              </div>
              <Button variant="filled" className="flex-1 justify-center" onClick={handleAdd}>
                Add to Order — ${item.price * qty}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
