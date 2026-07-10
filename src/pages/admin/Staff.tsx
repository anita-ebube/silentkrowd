// src/pages/admin/Staff.tsx
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import { listStaff, createStaff, manageStaff, getStaffActivity } from '@/services/adminApi'
import type { Profile, StaffActivityLog } from '@/types/database'

function CreateStaffModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createStaff({ full_name: fullName.trim(), email: email.trim(), phone: phone.trim() || undefined, password })
      onCreated()
      onClose()
      setFullName('')
      setEmail('')
      setPhone('')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create staff account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="bg-SilentKrowd-charcoal p-8">
        <h2 className="mb-6 font-serif text-2xl text-SilentKrowd-white">New Staff Account</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
          <input
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="Temporary password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" variant="filled" className="mt-2 justify-center" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Account'}
          </Button>
        </form>
      </div>
    </Modal>
  )
}

function ResetPasswordModal({
  staff,
  onClose,
  onDone,
}: {
  staff: Profile | null
  onClose: () => void
  onDone: () => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!staff) return
    setError(null)
    setSubmitting(true)
    try {
      await manageStaff('reset-password', staff.id, password)
      onDone()
      onClose()
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={!!staff} onClose={onClose} className="max-w-sm">
      <div className="bg-SilentKrowd-charcoal p-8">
        <h2 className="mb-1 font-serif text-xl text-SilentKrowd-white">Reset Password</h2>
        <p className="mb-6 text-sm text-SilentKrowd-muted">{staff?.full_name}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            type="password"
            minLength={8}
            placeholder="New password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" variant="filled" className="justify-center" disabled={submitting}>
            {submitting ? 'Saving…' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </Modal>
  )
}

function StaffActivityModal({ staff, onClose }: { staff: Profile | null; onClose: () => void }) {
  const [logs, setLogs] = useState<StaffActivityLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!staff) return
    setLoading(true)
    setError(null)
    getStaffActivity(staff.id)
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load activity.'))
      .finally(() => setLoading(false))
  }, [staff])

  return (
    <Modal open={!!staff} onClose={onClose} className="max-w-lg">
      <div className="max-h-[80vh] overflow-y-auto bg-SilentKrowd-charcoal p-8">
        <h2 className="mb-1 font-serif text-xl text-SilentKrowd-white">Account History</h2>
        <p className="mb-6 text-sm text-SilentKrowd-muted">
          Admin actions on {staff?.full_name}'s account
        </p>

        {loading && <p className="text-sm text-SilentKrowd-muted">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && logs.length === 0 && !error && (
          <p className="text-sm text-SilentKrowd-muted">No recorded activity yet.</p>
        )}

        <div className="flex flex-col divide-y divide-SilentKrowd-border">
          {logs.map((log) => (
            <div key={log.id} className="py-3">
              <p className="text-sm text-SilentKrowd-white">{log.action.replace(/_/g, ' ')}</p>
              <p className="text-xs text-SilentKrowd-muted">
                {new Date(log.created_at).toLocaleString()}
                {log.target_table ? ` · ${log.target_table}` : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default function Staff() {
  const [staff, setStaff] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<Profile | null>(null)
  const [activityTarget, setActivityTarget] = useState<Profile | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setStaff(await listStaff())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load staff.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleToggleStatus(member: Profile) {
    setBusyId(member.id)
    try {
      await manageStaff(member.status === 'active' ? 'suspend' : 'activate', member.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update staff status.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(member: Profile) {
    if (!window.confirm(`Delete ${member.full_name}'s account? This cannot be undone.`)) return
    setBusyId(member.id)
    try {
      await manageStaff('delete', member.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete staff account.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-SilentKrowd-white">Staff Management</h1>
        <Button variant="filled" onClick={() => setCreateOpen(true)}>
          New Staff Account
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto border border-SilentKrowd-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-SilentKrowd-border text-left text-xs uppercase tracking-wide text-SilentKrowd-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
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
            {!loading && staff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-SilentKrowd-muted">
                  No staff accounts yet.
                </td>
              </tr>
            )}
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-SilentKrowd-border/60 text-SilentKrowd-white">
                <td className="px-4 py-3">{member.full_name}</td>
                <td className="px-4 py-3 text-SilentKrowd-muted">{member.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded px-2.5 py-1 text-xs uppercase tracking-wide',
                      member.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-red-500/10 text-red-300',
                    )}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-SilentKrowd-muted">
                  {new Date(member.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      disabled={busyId === member.id}
                      onClick={() => handleToggleStatus(member)}
                      className="border border-SilentKrowd-border px-2.5 py-1.5 text-SilentKrowd-muted hover:text-SilentKrowd-white"
                    >
                      {member.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setActivityTarget(member)}
                      className="border border-SilentKrowd-border px-2.5 py-1.5 text-SilentKrowd-muted hover:text-SilentKrowd-white"
                    >
                      View Activity
                    </button>
                    <button
                      onClick={() => setResetTarget(member)}
                      className="border border-SilentKrowd-border px-2.5 py-1.5 text-SilentKrowd-muted hover:text-SilentKrowd-white"
                    >
                      Reset Password
                    </button>
                    <button
                      disabled={busyId === member.id}
                      onClick={() => handleDelete(member)}
                      className="border border-red-500/30 px-2.5 py-1.5 text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateStaffModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
      <ResetPasswordModal staff={resetTarget} onClose={() => setResetTarget(null)} onDone={load} />
      <StaffActivityModal staff={activityTarget} onClose={() => setActivityTarget(null)} />
    </div>
  )
}
