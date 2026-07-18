import { useState, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'
import { formatNaira } from '@/utils/currency'
import {
  createOrder,
  openPaystackPopup,
  verifyPayment,
  type CreateOrderResult,
} from '@/services/checkout'

type Step = 'details' | 'paying' | 'verifying' | 'failed'

const PHONE_RE = /^\+?[0-9]{7,15}$/

export function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, subtotal, clearCart } = useCart()
  const navigate = useNavigate()

  const idempotencyKey = useRef(crypto.randomUUID())
  const [step, setStep] = useState<Step>('details')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingOrder, setPendingOrder] = useState<CreateOrderResult | null>(null)

  function resetAndClose() {
    setStep('details')
    setFormError(null)
    idempotencyKey.current = crypto.randomUUID()
    onClose()
  }

  async function runPaystackAndVerify(order: CreateOrderResult, guestEmail: string) {
    setStep('paying')

    const popupResult = await openPaystackPopup({
      email: guestEmail,
      amountNaira: order.total_amount,
      reference: order.reference,
      orderNumber: order.order_number,
    })

    if (!popupResult) {
      setStep('failed')
      return
    }

    setStep('verifying')
    const result = await verifyPayment(order.order_id, popupResult.reference)

    if (result.status === 'success') {
      clearCart()
      navigate('/order/success', {
        state: { orderNumber: order.order_number, phone },
      })
      resetAndClose()
    } else {
      setStep('failed')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!fullName.trim()) return setFormError('Please enter your full name.')
    if (!PHONE_RE.test(phone.trim())) return setFormError('Please enter a valid phone number.')
    if (!deliveryAddress.trim()) return setFormError('Please enter a delivery address.')
    if (lines.length === 0) return setFormError('Your cart is empty.')

    try {
      const order = await createOrder(
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          deliveryAddress: deliveryAddress.trim(),
          deliveryInstructions: deliveryInstructions.trim() || undefined,
          idempotencyKey: idempotencyKey.current,
        },
        lines.map((l) => ({
          menu_item_id: l.id,
          name: l.name,
          category: l.category,
          unit_price: l.price,
          quantity: l.qty,
        })),
      )

      setPendingOrder(order)
      const guestEmail = email.trim() || `${phone.trim()}@guest.SilentKrowd-lounge.com`
      await runPaystackAndVerify(order, guestEmail)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not place order. Please try again.')
    }
  }

  async function handleRetry() {
    if (!pendingOrder) return
    const guestEmail = email.trim() || `${phone.trim()}@guest.SilentKrowd-lounge.com`
    await runPaystackAndVerify(pendingOrder, guestEmail)
  }

  return (
    <Modal open={open} onClose={resetAndClose} className="max-w-lg">
      <div className="bg-SilentKrowd-charcoal p-8 md:p-10">
        {step === 'details' && (
          <>
            <h2 className="mb-1 font-serif text-2xl text-SilentKrowd-white">Checkout</h2>
            <p className="mb-6 text-sm text-SilentKrowd-muted">
              Subtotal: <span className="text-SilentKrowd-gold">{formatNaira(subtotal)}</span> ·
              Delivery fee calculated at checkout
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                required
                placeholder="Full name *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
              />
              <input
                required
                placeholder="Phone number *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
              />
              <textarea
                required
                placeholder="Delivery address *"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={2}
                className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
              />
              <textarea
                placeholder="Delivery instructions (optional)"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                rows={2}
                className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
              />

              {formError && <p className="text-sm text-red-400">{formError}</p>}

              <Button type="submit" variant="filled" className="mt-2 justify-center">
                Continue to Payment
              </Button>
            </form>
          </>
        )}

        {step === 'paying' && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-SilentKrowd-white">Opening secure payment window…</p>
            <p className="text-xs text-SilentKrowd-muted">
              If nothing appears, check that pop-ups aren't blocked for this site.
            </p>
          </div>
        )}

        {step === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-SilentKrowd-white">Confirming your payment…</p>
          </div>
        )}

        {step === 'failed' && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-SilentKrowd-white">
              Payment wasn't completed. Your order is saved — you can try again.
            </p>
            {pendingOrder && (
              <p className="text-xs text-SilentKrowd-muted">Order #{pendingOrder.order_number}</p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('details')}>
                Edit Details
              </Button>
              <Button variant="filled" onClick={handleRetry}>
                Retry Payment
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
