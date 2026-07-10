// src/pages/admin/Coupons.tsx
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import { formatNaira } from '@/utils/currency'
import { listCoupons, createCoupon, setCouponActive } from '@/services/adminApi'
import type { Coupon } from '@/types/database'

function CreateCouponModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [minOrderAmount, setMinOrderAmount] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function resetForm() {
    setCode('')
    setDiscountValue('')
    setMinOrderAmount('')
    setUsageLimit('')
    setExpiresAt('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const value = Number(discountValue)
    if (!code.trim()) return setError('Enter a coupon code.')
    if (!value || value <= 0) return setError('Enter a discount value greater than 0.')
    if (discountType === 'percentage' && value > 100) return setError('Percentage discount cannot exceed 100.')

    setSubmitting(true)
    try {
      await createCoupon({
        code: code.trim(),
        discount_type: discountType,
        discount_value: value,
        min_order_amount: minOrderAmount ? Number(minOrderAmount) : 0,
        usage_limit: usageLimit ? Number(usageLimit) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      onCreated()
      onClose()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create coupon.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="bg-SilentKrowd-charcoal p-8">
        <h2 className="mb-6 font-serif text-2xl text-SilentKrowd-white">New Coupon</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            placeholder="Code (e.g. WELCOME10)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm uppercase text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />

          <div className="flex gap-3">
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
              className="flex-1 border border-SilentKrowd-border bg-SilentKrowd-black px-3 py-3 text-sm text-SilentKrowd-white"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount (₦)</option>
            </select>
            <input
              required
              type="number"
              placeholder={discountType === 'percentage' ? '% off' : '₦ off'}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="flex-1 border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
            />
          </div>

          <input
            type="number"
            placeholder="Minimum order amount (optional)"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
          <input
            type="number"
            placeholder="Usage limit (optional)"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-SilentKrowd-muted">
              Expires (optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" variant="filled" className="mt-2 justify-center" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Coupon'}
          </Button>
        </form>
      </div>
    </Modal>
  )
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setCoupons(await listCoupons())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load coupons.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleToggle(coupon: Coupon) {
    setBusyId(coupon.id)
    try {
      await setCouponActive(coupon.id, !coupon.active)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update coupon.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-SilentKrowd-white">Coupons</h1>
        <Button variant="filled" onClick={() => setCreateOpen(true)}>
          New Coupon
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto border border-SilentKrowd-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-SilentKrowd-border text-left text-xs uppercase tracking-wide text-SilentKrowd-muted">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min. Order</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-SilentKrowd-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && coupons.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-SilentKrowd-muted">
                  No coupons yet.
                </td>
              </tr>
            )}
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-SilentKrowd-border/60 text-SilentKrowd-white">
                <td className="px-4 py-3 tracking-wide">{coupon.code}</td>
                <td className="px-4 py-3">
                  {coupon.discount_type === 'percentage'
                    ? `${coupon.discount_value}%`
                    : formatNaira(coupon.discount_value)}
                </td>
                <td className="px-4 py-3 text-SilentKrowd-muted">
                  {coupon.min_order_amount > 0 ? formatNaira(coupon.min_order_amount) : '—'}
                </td>
                <td className="px-4 py-3 text-SilentKrowd-muted">
                  {coupon.times_used}
                  {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                </td>
                <td className="px-4 py-3 text-SilentKrowd-muted">
                  {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded px-2.5 py-1 text-xs uppercase tracking-wide',
                      coupon.active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/10 text-white/50',
                    )}
                  >
                    {coupon.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    disabled={busyId === coupon.id}
                    onClick={() => handleToggle(coupon)}
                    className="border border-SilentKrowd-border px-2.5 py-1.5 text-xs text-SilentKrowd-muted hover:text-SilentKrowd-white"
                  >
                    {coupon.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateCouponModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
    </div>
  )
}
