import { useState } from 'react'
import { Clock, Flame, UtensilsCrossed, Star } from 'lucide-react'
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
              src={`https://picsum.photos/seed/${item.img}/800/1000`}
              alt={item.name}
              className="h-full w-full object-cover brightness-50 contrast-110 saturate-75"
            />
          </div>
          <div className="flex flex-col justify-center p-8 md:p-12">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="border border-SilentKrowd-gold/20 px-3 py-1 text-[0.55rem] uppercase tracking-wider text-SilentKrowd-gold/60">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="mb-2 font-serif text-3xl text-SilentKrowd-white md:text-4xl">{item.name}</h2>
            <div className="mb-6 flex items-center gap-3">
              <span className="font-serif text-2xl text-SilentKrowd-gold">${item.price}</span>
              <div className="flex items-center gap-1 text-SilentKrowd-gold/60">
                <Star size={14} fill="currentColor" />
                <span className="text-sm">{item.rating}</span>
              </div>
            </div>
            <p className="mb-6 text-sm font-light leading-relaxed text-SilentKrowd-muted">{item.desc}</p>
            <div className="mb-6">
              <h4 className="mb-3 text-[0.6rem] uppercase tracking-[0.2em] text-SilentKrowd-gold">Chef's Note</h4>
              <p className="text-sm font-light italic leading-relaxed text-SilentKrowd-muted/80">"{item.chefNote}"</p>
            </div>
            <div className="mb-6 grid grid-cols-3 gap-4 rounded-sm border border-SilentKrowd-border bg-SilentKrowd-glass p-4">
              <div className="text-center">
                <Clock size={18} className="mx-auto text-SilentKrowd-gold/60" />
                <p className="mt-1 text-xs text-SilentKrowd-white">{item.prep}</p>
              </div>
              <div className="text-center">
                <Flame size={18} className="mx-auto text-SilentKrowd-gold/60" />
                <p className="mt-1 text-xs text-SilentKrowd-white">{item.cal} cal</p>
              </div>
              <div className="text-center">
                <UtensilsCrossed size={18} className="mx-auto text-SilentKrowd-gold/60" />
                <p className="mt-1 text-xs text-SilentKrowd-white">{item.ingredients.length} items</p>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="mb-3 text-[0.6rem] uppercase tracking-[0.2em] text-SilentKrowd-gold">Ingredients</h4>
              <div className="flex flex-wrap gap-2">
                {item.ingredients.map((ing) => (
                  <span key={ing} className="rounded-sm border border-SilentKrowd-border px-3 py-1 text-xs text-SilentKrowd-white/60">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
            {item.winePairing && (
              <div className="mb-4">
                <h4 className="mb-1 text-[0.6rem] uppercase tracking-[0.2em] text-SilentKrowd-gold">Wine Pairing</h4>
                <p className="text-sm font-light text-SilentKrowd-white/80">{item.winePairing}</p>
              </div>
            )}
            {item.cocktailPairing && (
              <div className="mb-6">
                <h4 className="mb-1 text-[0.6rem] uppercase tracking-[0.2em] text-SilentKrowd-gold">Recommended Cocktail</h4>
                <p className="text-sm font-light text-SilentKrowd-white/80">{item.cocktailPairing}</p>
              </div>
            )}
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
