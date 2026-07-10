// src/components/admin/OrderDetailModal.tsx
import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatNaira } from '@/utils/currency'
import { useAuth } from '@/context/AuthContext'
import { StatusBadge, ORDER_STATUS_OPTIONS, statusLabel } from '@/components/admin/StatusBadge'
import {
  getOrderDetail,
  updateOrderStatus,
  assignStaffToOrder,
  cancelOrder,
  refundOrder,
  listAssignableStaff,
} from '@/services/adminApi'
import type { OrderWithItems, OrderStatus, Profile } from '@/types/database'

export function OrderDetailModal({
  orderId,
  onClose,
  onChanged,
}: {
  orderId: string | null
  onClose: () => void
  onChanged: () => void
}) {
  const { isAdmin } = useAuth()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [staffOptions, setStaffOptions] = useState<Profile[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelForm, setShowCancelForm] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      return
    }
    setError(null)
    getOrderDetail(orderId).then(setOrder).catch((err) => setError(err.message))
    listAssignableStaff().then(setStaffOptions).catch(() => {})
  }, [orderId])

  async function refresh() {
    if (!orderId) return
    const fresh = await getOrderDetail(orderId)
    setOrder(fresh)
    onChanged()
  }

  async function handleStatusChange(status: OrderStatus) {
    if (!orderId) return
    setBusy(true)
    setError(null)
    try {
      await updateOrderStatus(orderId, status)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.')
    } finally {
      setBusy(false)
    }
  }

  async function handleAssign(staffId: string) {
    if (!orderId) return
    setBusy(true)
    setError(null)
    try {
      await assignStaffToOrder(orderId, staffId || null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign staff.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel() {
    if (!orderId) return
    setBusy(true)
    setError(null)
    try {
      await cancelOrder(orderId, cancelReason.trim() || 'Cancelled by staff')
      setShowCancelForm(false)
      setCancelReason('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel order.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRefund() {
    if (!orderId) return
    if (!window.confirm('Refund this order via Paystack? This cannot be undone.')) return
    setBusy(true)
    setError(null)
    try {
      await refundOrder(orderId, 'Refunded by admin')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refund failed.')
    } finally {
      setBusy(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <Modal open={!!orderId} onClose={onClose} className="max-w-2xl">
      <div className="max-h-[85vh] overflow-y-auto bg-SilentKrowd-charcoal p-8">
        {!order ? (
          <p className="text-SilentKrowd-muted">Loading…</p>
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="font-serif text-2xl text-SilentKrowd-white">{order.order_number}</h2>
                <p className="text-sm text-SilentKrowd-muted">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

            <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-SilentKrowd-muted">Customer</p>
                <p className="text-SilentKrowd-white">{order.customer.full_name}</p>
                <p className="text-SilentKrowd-muted">{order.customer.phone}</p>
                {order.customer.email && <p className="text-SilentKrowd-muted">{order.customer.email}</p>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-SilentKrowd-muted">Delivery Address</p>
                <p className="text-SilentKrowd-white">{order.delivery_address}</p>
                {order.delivery_instructions && (
                  <p className="text-SilentKrowd-muted">{order.delivery_instructions}</p>
                )}
              </div>
            </div>

            <div className="mb-6 space-y-2 border-y border-SilentKrowd-border py-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-SilentKrowd-white">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="text-SilentKrowd-muted">{formatNaira(item.line_total)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-sm text-SilentKrowd-muted">
                <span>Subtotal</span>
                <span>{formatNaira(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-SilentKrowd-muted">
                <span>Delivery Fee</span>
                <span>{formatNaira(order.delivery_fee)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-SilentKrowd-muted">
                  <span>Discount</span>
                  <span>-{formatNaira(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-serif text-lg text-SilentKrowd-white">
                <span>Total</span>
                <span>{formatNaira(order.total_amount)}</span>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-SilentKrowd-muted">
                  Order Status
                </label>
                <select
                  disabled={busy}
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                  className="w-full border border-SilentKrowd-border bg-SilentKrowd-black px-3 py-2 text-sm text-SilentKrowd-white"
                >
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-SilentKrowd-muted">
                  Assigned Staff
                </label>
                {isAdmin ? (
                  <select
                    disabled={busy}
                    value={order.assigned_staff_id ?? ''}
                    onChange={(e) => handleAssign(e.target.value)}
                    className="w-full border border-SilentKrowd-border bg-SilentKrowd-black px-3 py-2 text-sm text-SilentKrowd-white"
                  >
                    <option value="">Unassigned</option>
                    {staffOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="px-3 py-2 text-sm text-SilentKrowd-white">
                    {staffOptions.find((s) => s.id === order.assigned_staff_id)?.full_name ?? 'Unassigned'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handlePrint}>
                Print Ticket
              </Button>

              {order.status !== 'cancelled' && order.status !== 'refunded' && (
                <Button variant="outline" onClick={() => setShowCancelForm((v) => !v)}>
                  Cancel Order
                </Button>
              )}

              {isAdmin && order.payment?.status === 'success' && order.status !== 'refunded' && (
                <Button variant="outline" onClick={handleRefund} disabled={busy}>
                  Refund
                </Button>
              )}
            </div>

            {showCancelForm && (
              <div className="mt-4 flex flex-col gap-2">
                <textarea
                  placeholder="Reason for cancellation"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  className="border border-SilentKrowd-border bg-transparent px-3 py-2 text-sm text-SilentKrowd-white outline-none"
                />
                <Button variant="filled" onClick={handleCancel} disabled={busy}>
                  Confirm Cancellation
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
