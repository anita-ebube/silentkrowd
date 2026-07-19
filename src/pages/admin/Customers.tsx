// src/pages/admin/Customers.tsx
import { useEffect, useState, type FormEvent } from 'react'
import { formatNaira } from '@/utils/currency'
import { listCustomers } from '@/services/adminApi'
import type { Customer } from '@/types/database'

const PAGE_SIZE = 20

export default function Customers() {
  const [rows, setRows] = useState<Customer[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await listCustomers({ search, page, pageSize: PAGE_SIZE })
      setRows(result.rows)
      setCount(result.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load customers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    setPage(1)
    load()
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl text-SilentKrowd-white">Customers</h1>

      <form onSubmit={handleSearchSubmit} className="mb-6">
        <input
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-72 border border-SilentKrowd-border bg-transparent px-3 py-2 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
        />
      </form>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto border border-SilentKrowd-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-SilentKrowd-border text-left text-xs uppercase tracking-wide text-SilentKrowd-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Total Orders</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Last Order</th>
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
                  No customers found.
                </td>
              </tr>
            )}
            {rows.map((customer) => (
              <tr
                key={customer.id}
                className="border-b border-SilentKrowd-border/60 text-SilentKrowd-white"
              >
                <td className="px-4 py-3">{customer.full_name}</td>
                <td className="px-4 py-3 text-SilentKrowd-muted">{customer.phone}</td>
                <td className="px-4 py-3 text-SilentKrowd-muted">{customer.email ?? '—'}</td>
                <td className="px-4 py-3">{customer.total_orders}</td>
                <td className="px-4 py-3 text-SilentKrowd-gold">{formatNaira(customer.total_spent)}</td>
                <td className="px-4 py-3 text-SilentKrowd-muted">
                  {customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-SilentKrowd-muted">
        <span>
          Page {page} of {totalPages} · {count} customers
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
    </div>
  )
}
