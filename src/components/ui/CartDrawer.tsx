import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { formatNaira } from '@/utils/currency'
import { CheckoutModal } from '@/components/checkout/CheckoutModal'
import { Button } from './Button'

export function CartDrawer() {
  const { lines, isOpen, closeCart, updateQty, removeItem, subtotal } = useCart()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  useLockBodyScroll(isOpen)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9994] bg-SilentKrowd-black/60"
            onClick={closeCart}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="fixed inset-y-0 right-0 z-[9995] flex w-full max-w-[420px] flex-col border-l border-SilentKrowd-border bg-SilentKrowd-charcoal/98 backdrop-blur-lg"
          >
            <div className="flex items-center justify-between border-b border-SilentKrowd-border p-6">
              <h3 className="font-serif text-xl text-SilentKrowd-white">Your Order</h3>
              <button aria-label="Close cart" onClick={closeCart} className="text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBag size={44} className="mb-4 text-SilentKrowd-muted/30" />
                  <p className="text-sm font-light text-SilentKrowd-muted">Your order is empty</p>
                  <p className="mt-1 text-xs text-SilentKrowd-muted/50">Explore the menu to add items</p>
                </div>
              ) : (
                lines.map((line) => (
                  <div key={line.id} className="mb-5 flex gap-4 border-b border-SilentKrowd-border pb-5 last:border-0">
                    <img
                      src={line.img}
                      alt=""
                      className="h-16 w-16 flex-shrink-0 rounded-sm object-cover brightness-75"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-SilentKrowd-white">{line.name}</h4>
                      <p className="mt-0.5 text-sm text-SilentKrowd-gold">{formatNaira(line.price)}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center rounded-sm border border-SilentKrowd-border">
                          <button
                            className="flex h-7 w-7 items-center justify-center text-xs text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white"
                            onClick={() => updateQty(line.id, -1)}
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs text-SilentKrowd-white">{line.qty}</span>
                          <button
                            className="flex h-7 w-7 items-center justify-center text-xs text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white"
                            onClick={() => updateQty(line.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          aria-label="Remove item"
                          className="ml-auto text-SilentKrowd-muted/50 transition-colors hover:text-red-400"
                          onClick={() => removeItem(line.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-SilentKrowd-border p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-SilentKrowd-muted">Subtotal</span>
                  <span className="font-serif text-xl text-SilentKrowd-white">{formatNaira(subtotal)}</span>
                </div>
                <Button
                  variant="filled"
                  className="w-full justify-center"
                  onClick={() => setCheckoutOpen(true)}
                >
                  Place Order
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </AnimatePresence>
  )
}
