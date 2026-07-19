// src/pages/admin/Orders.tsx
import { useEffect, useState, type FormEvent } from 'react'
import { formatNaira } from '@/utils/currency'
import { StatusBadge, ORDER_STATUS_OPTIONS, statusLabel } from '@/components/admin/StatusBadge'
import { OrderDetailModal } from '@/components/admin/OrderDetailModal'
import { listOrders, type OrderSearchRow } from '@/services/adminApi'
import type { OrderStatus } from '@/types/database'

const PAGE_SIZE = 20

export default function Orders() {
  const [rows, setRows] = useState<OrderSearchRow[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await listOrders({ search, status, page, pageSize: PAGE_SIZE })
      setRows(result.rows)
      setCount(result.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    setPage(1)
    load()
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl text-SilentKrowd-white">Orders</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            placeholder="Search order number, customer name, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72 border border-SilentKrowd-border bg-transparent px-3 py-2 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
        </form>

        <select
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value as OrderStatus | 'all')
          }}
          className="border border-SilentKrowd-border bg-SilentKrowd-black px-3 py-2 text-sm text-SilentKrowd-white"
        >
          <option value="all">All Statuses</option>
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto border border-SilentKrowd-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-SilentKrowd-border text-left text-xs uppercase tracking-wide text-SilentKrowd-muted">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-SilentKrowd-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-SilentKrowd-muted">
                  No orders found.
                </td>
              </tr>
            )}
            {rows.map((order) => (
              <tr
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="cursor-pointer border-b border-SilentKrowd-border/60 text-SilentKrowd-white transition-colors hover:bg-white/5"
              >
                <td className="px-4 py-3">{order.order_number}</td>
                <td className="px-4 py-3">
                  <p>{order.customer_name}</p>
                  <p className="text-xs text-SilentKrowd-muted">{order.customer_phone}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-SilentKrowd-muted">
                  {order.assigned_staff_name ?? '—'}
                </td>
                <td className="px-4 py-3 text-SilentKrowd-gold">{formatNaira(order.total_amount)}</td>
                <td className="px-4 py-3 text-SilentKrowd-muted">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-SilentKrowd-muted">
        <span>
          Page {page} of {totalPages} · {count} orders
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border border-SilentKrowd-border px-3 py-1 disabled:opacity-30"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="border border-SilentKrowd-border px-3 py-1 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>

      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onChanged={load}
      />
    </div>
  )
}
