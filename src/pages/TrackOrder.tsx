// src/pages/TrackOrder.tsx
import { useEffect, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { formatNaira } from '@/utils/currency'
import { trackOrder } from '@/services/checkout'
import type { TrackedOrder } from '@/types/database'

const PROGRESS_STEPS: Array<{ key: string; label: string }> = [
  { key: 'order_received', label: 'Order Received' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'on_the_way', label: 'On the Way' },
  { key: 'delivered', label: 'Delivered' },
]

const SIMPLIFIED_MAP: Record<string, string> = {
  pending_payment: 'awaiting_payment',
  paid: 'order_received',
  confirmed: 'order_received',
  preparing: 'preparing',
  ready: 'preparing',
  out_for_delivery: 'on_the_way',
  delivered: 'delivered',
  cancelled: 'cancelled',
  refunded: 'cancelled',
}

export default function TrackOrder() {
  const location = useLocation()
  const prefill = location.state as { orderNumber?: string; phone?: string } | null

  const [orderNumber, setOrderNumber] = useState(prefill?.orderNumber ?? '')
  const [phone, setPhone] = useState(prefill?.phone ?? '')
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function runLookup(number: string, phoneNumber: string) {
    setError(null)
    setLoading(true)
    try {
      const result = await trackOrder(number.trim(), phoneNumber.trim())
      setOrder(result as unknown as TrackedOrder)
    } catch (err) {
      setOrder(null)
      setError(err instanceof Error ? err.message : 'Could not find that order.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (prefill?.orderNumber && prefill?.phone) {
      runLookup(prefill.orderNumber, prefill.phone)
    }
    // Only run once, on arrival with prefilled state (e.g. from the success page).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Enter both your order number and phone number.')
      return
    }
    runLookup(orderNumber, phone)
  }

  const simplified = order ? SIMPLIFIED_MAP[order.status] : null
  const cancelled = simplified === 'cancelled'
  const currentStepIndex = PROGRESS_STEPS.findIndex((s) => s.key === simplified)

  return (
    <div className="min-h-screen bg-SilentKrowd-black py-24">
      <Container className="max-w-xl">
        <h1 className="mb-8 font-serif text-3xl text-SilentKrowd-white">Track Your Order</h1>

        <form onSubmit={handleSubmit} className="mb-10 flex flex-col gap-4">
          <input
            placeholder="Order number (e.g. SK-20260709-0001)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
          <input
            placeholder="Phone number used at checkout"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
          <Button type="submit" variant="filled" className="justify-center">
            {loading ? 'Looking up…' : 'Track Order'}
          </Button>
        </form>

        {error && <p className="mb-8 text-sm text-red-400">{error}</p>}

        {order && (
          <div className="border border-SilentKrowd-border p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-serif text-xl text-SilentKrowd-gold">{order.order_number}</span>
              <span className="text-xs uppercase tracking-[0.15em] text-SilentKrowd-muted">
                {simplified === 'awaiting_payment' ? 'Awaiting Payment' : cancelled ? 'Cancelled' : ''}
              </span>
            </div>

            {!cancelled && simplified !== 'awaiting_payment' && (
              <div className="mb-8 flex items-center justify-between">
                {PROGRESS_STEPS.map((step, i) => (
                  <div key={step.key} className="flex flex-1 flex-col items-center text-center">
                    <div
                      className={`mb-2 h-2 w-2 rounded-full ${
                        i <= currentStepIndex ? 'bg-SilentKrowd-gold' : 'bg-SilentKrowd-border'
                      }`}
                    />
                    <span
                      className={`text-[0.65rem] uppercase tracking-wide ${
                        i <= currentStepIndex ? 'text-SilentKrowd-white' : 'text-SilentKrowd-muted/50'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-4 space-y-2 border-t border-SilentKrowd-border pt-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-SilentKrowd-muted">
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                  <span>{formatNaira(item.line_total)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 border-t border-SilentKrowd-border pt-4 text-sm">
              <div className="flex justify-between text-SilentKrowd-muted">
                <span>Subtotal</span>
                <span>{formatNaira(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-SilentKrowd-muted">
                <span>Delivery Fee</span>
                <span>{formatNaira(order.delivery_fee)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-SilentKrowd-muted">
                  <span>Discount</span>
                  <span>-{formatNaira(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 font-serif text-lg text-SilentKrowd-white">
                <span>Total</span>
                <span>{formatNaira(order.total_amount)}</span>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
