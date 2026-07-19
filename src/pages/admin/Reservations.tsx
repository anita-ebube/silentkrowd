import { useEffect, useState, type FormEvent } from 'react'
import { listReservations, updateReservationStatus } from '@/services/adminApi'
import type { Reservation, ReservationStatus } from '@/types/database'

const PAGE_SIZE = 20

const STATUS_STYLES: Record<ReservationStatus, string> = {
  pending: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  confirmed: 'text-green-400 border-green-400/30 bg-green-400/10',
  cancelled: 'text-red-400 border-red-400/30 bg-red-400/10',
}

export default function ReservationsAdmin() {
  const [rows, setRows] = useState<Reservation[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await listReservations({ search, status: statusFilter, page, pageSize: PAGE_SIZE })
      setRows(result.rows)
      setCount(result.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reservations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    setPage(1)
    load()
  }

  async function handleStatusChange(id: string, newStatus: ReservationStatus) {
    try {
      await updateReservationStatus(id, newStatus)
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl text-SilentKrowd-white">Reservations</h1>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearchSubmit}>
          <input
            placeholder="Search by name, phone or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72 border border-SilentKrowd-border bg-transparent px-3 py-2 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
        </form>
        <div className="flex gap-2">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`border px-3 py-1.5 text-xs uppercase tracking-wide transition-colors ${
                statusFilter === s
                  ? 'border-SilentKrowd-gold/60 bg-SilentKrowd-gold/10 text-SilentKrowd-gold'
                  : 'border-SilentKrowd-border text-SilentKrowd-muted hover:text-SilentKrowd-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto border border-SilentKrowd-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-SilentKrowd-border text-left text-xs uppercase tracking-wide text-SilentKrowd-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-SilentKrowd-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-SilentKrowd-muted">
                  No reservations found.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-SilentKrowd-border/60 text-SilentKrowd-white">
                <td className="px-4 py-3">{r.full_name}</td>
                <td className="px-4 py-3 text-SilentKrowd-muted">{r.phone}</td>
                <td className="px-4 py-3 text-SilentKrowd-muted">{r.email}</td>
                <td className="px-4 py-3">{r.reservation_date}</td>
                <td className="px-4 py-3 text-SilentKrowd-muted">{r.preferred_time}</td>
                <td className="px-4 py-3 text-SilentKrowd-muted">{r.party_size}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded border px-2 py-0.5 text-xs ${STATUS_STYLES[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(r.id, 'confirmed')}
                        className="text-xs text-green-400 transition-colors hover:text-green-300"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusChange(r.id, 'cancelled')}
                        className="text-xs text-red-400 transition-colors hover:text-red-300"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-SilentKrowd-muted">
        <span>
          Page {page} of {totalPages} · {count} reservations
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
