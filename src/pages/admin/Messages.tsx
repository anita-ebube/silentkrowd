import { useEffect, useState, type FormEvent } from 'react'
import { Mail, Trash2 } from 'lucide-react'
import { listContactMessages, markMessageRead, deleteContactMessage } from '@/services/adminApi'
import type { ContactMessage } from '@/types/database'

const PAGE_SIZE = 20

export default function Messages() {
  const [rows, setRows] = useState<ContactMessage[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await listContactMessages({ search, unreadOnly, page, pageSize: PAGE_SIZE })
      setRows(result.rows)
      setCount(result.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load messages.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, unreadOnly])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    setPage(1)
    load()
  }

  async function handleExpand(row: ContactMessage) {
    if (expandedId === row.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(row.id)
    if (!row.read) {
      try {
        await markMessageRead(row.id)
        setRows((prev) => prev.map((m) => (m.id === row.id ? { ...m, read: true } : m)))
      } catch {
        // non-critical
      }
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteContactMessage(id)
      setRows((prev) => prev.filter((m) => m.id !== id))
      setCount((c) => c - 1)
      if (expandedId === id) setExpandedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl text-SilentKrowd-white">Messages</h1>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearchSubmit}>
          <input
            placeholder="Search by name, email or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72 border border-SilentKrowd-border bg-transparent px-3 py-2 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
        </form>
        <button
          onClick={() => { setUnreadOnly((u) => !u); setPage(1) }}
          className={`flex items-center gap-2 border px-3 py-1.5 text-xs uppercase tracking-wide transition-colors ${
            unreadOnly
              ? 'border-SilentKrowd-gold/60 bg-SilentKrowd-gold/10 text-SilentKrowd-gold'
              : 'border-SilentKrowd-border text-SilentKrowd-muted hover:text-SilentKrowd-white'
          }`}
        >
          <Mail size={12} />
          Unread only
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto border border-SilentKrowd-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-SilentKrowd-border text-left text-xs uppercase tracking-wide text-SilentKrowd-muted">
              <th className="w-8 px-4 py-3" />
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-SilentKrowd-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-SilentKrowd-muted">
                  No messages found.
                </td>
              </tr>
            )}
            {rows.map((msg) => (
              <>
                <tr
                  key={msg.id}
                  onClick={() => handleExpand(msg)}
                  className={`cursor-pointer border-b border-SilentKrowd-border/60 transition-colors hover:bg-white/[0.02] ${
                    !msg.read ? 'text-SilentKrowd-white' : 'text-SilentKrowd-muted'
                  }`}
                >
                  <td className="px-4 py-3">
                    {!msg.read && (
                      <span className="block h-2 w-2 rounded-full bg-SilentKrowd-gold" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={!msg.read ? 'font-medium text-SilentKrowd-white' : ''}>
                      {msg.full_name}
                    </span>
                    <span className="ml-2 text-xs text-SilentKrowd-muted">{msg.email}</span>
                  </td>
                  <td className="px-4 py-3">{msg.subject}</td>
                  <td className="px-4 py-3 text-SilentKrowd-muted">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(msg.id) }}
                      className="text-SilentKrowd-muted transition-colors hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
                {expandedId === msg.id && (
                  <tr key={`${msg.id}-expanded`}>
                    <td colSpan={5} className="border-b border-SilentKrowd-border/60 bg-white/[0.02] px-8 py-5">
                      <p className="mb-1 text-xs uppercase tracking-wider text-SilentKrowd-gold">Message</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-SilentKrowd-white/80">
                        {msg.message}
                      </p>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-SilentKrowd-muted">
        <span>
          Page {page} of {totalPages} · {count} messages
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
