import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Plus, Trash2, Upload, ImageIcon, Search, X } from 'lucide-react'
import {
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateMenuItemImage,
  type MenuItemRow,
} from '@/services/adminApi'

const CATEGORIES = [
  { label: 'Starters', value: 'starters' },
  { label: 'Main Dishes', value: 'main_dishes' },
  { label: 'Proteins', value: 'proteins' },
  { label: 'Drinks', value: 'drinks' },
]

const emptyForm = { name: '', category: 'starters', price: '' }

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formFile, setFormFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [uploadingImgId, setUploadingImgId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgInputRefs = useRef<Map<number, HTMLInputElement>>(new Map())

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listMenuItems()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load menu items.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchSearch && matchCategory
  })

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) return
    if (formFile && formFile.size > 1 * 1024 * 1024) {
      setError('Image must be under 1 MB.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const price = Number(form.price)
      if (isNaN(price) || price < 0) {
        setError('Invalid price')
        return
      }
      await createMenuItem(form.name.trim(), form.category, price, formFile)
      setForm(emptyForm)
      setFormFile(null)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(item: MenuItemRow) {
    try {
      await updateMenuItem(item.id, { active: !item.active })
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item.')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this menu item?')) return
    try {
      await deleteMenuItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item.')
    }
  }

  async function handleImageUpload(id: number, file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 1 * 1024 * 1024) {
      setError('Image must be under 1 MB.')
      return
    }
    setUploadingImgId(id)
    setError(null)
    try {
      const url = await updateMenuItemImage(id, file)
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, image: url } : i)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image.')
    } finally {
      setUploadingImgId(null)
    }
  }

  function startEdit(item: MenuItemRow) {
    setEditingId(item.id)
    setForm({ name: item.name, category: item.category, price: String(item.price) })
  }

  async function saveEdit(id: number) {
    if (!form.name.trim() || !form.price) return
    setError(null)
    try {
      const price = Number(form.price)
      if (isNaN(price) || price < 0) {
        setError('Invalid price')
        return
      }
      await updateMenuItem(id, { name: form.name.trim(), category: form.category, price })
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, name: form.name.trim(), category: form.category, price } : i,
        ),
      )
      setEditingId(null)
      setForm(emptyForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item.')
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-SilentKrowd-white">Menu</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setFormFile(null) }}
          className="flex items-center gap-2 rounded bg-SilentKrowd-gold px-4 py-2 text-xs uppercase tracking-wider text-SilentKrowd-black transition-colors hover:bg-SilentKrowd-goldLight"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-SilentKrowd-muted" />
          <input
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-SilentKrowd-border bg-transparent px-3 py-2 pl-9 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-SilentKrowd-border bg-transparent px-3 py-2 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-lg border border-SilentKrowd-border bg-SilentKrowd-charcoal p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl text-SilentKrowd-white">New Menu Item</h2>
              <button onClick={() => setShowForm(false)} className="text-SilentKrowd-muted hover:text-SilentKrowd-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Item name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="border border-SilentKrowd-border bg-transparent px-3 py-2 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
              />
              <div className="flex gap-4">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex-1 border border-SilentKrowd-border bg-transparent px-3 py-2 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Price (₦)"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  min="0"
                  required
                  className="w-40 border border-SilentKrowd-border bg-transparent px-3 py-2 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
                />
              </div>
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-SilentKrowd-border px-4 py-3 text-sm text-SilentKrowd-muted transition-colors hover:border-SilentKrowd-gold/40"
                >
                  <Upload size={16} />
                  {formFile ? formFile.name : 'Upload image (optional)'}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    if (file && file.size > 1 * 1024 * 1024) {
                      setError('Image must be under 1 MB.')
                      setFormFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                      return
                    }
                    setError(null)
                    setFormFile(file)
                  }}
                  className="hidden"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="border border-SilentKrowd-border px-4 py-2 text-xs uppercase tracking-wider text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded bg-SilentKrowd-gold px-4 py-2 text-xs uppercase tracking-wider text-SilentKrowd-black transition-colors hover:bg-SilentKrowd-goldLight disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="py-8 text-center text-SilentKrowd-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-SilentKrowd-border py-16 text-SilentKrowd-muted">
          <ImageIcon size={32} />
          <p className="text-sm">No menu items found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-SilentKrowd-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-SilentKrowd-border text-left text-xs uppercase tracking-wide text-SilentKrowd-muted">
                <th className="w-16 px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-SilentKrowd-border/60 transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded bg-SilentKrowd-charcoal">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-SilentKrowd-muted/30">
                          <ImageIcon size={16} />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          if (!f.type.startsWith('image/')) {
                            setError('Please select an image file.')
                            e.target.value = ''
                            return
                          }
                          if (f.size > 1 * 1024 * 1024) {
                            setError('Image must be under 1 MB.')
                            e.target.value = ''
                            return
                          }
                          handleImageUpload(item.id, f)
                        }}
                        ref={(el) => { if (el) imgInputRefs.current.set(item.id, el) }}
                        className="hidden"
                      />
                      <button
                        onClick={() => imgInputRefs.current.get(item.id)?.click()}
                        disabled={uploadingImgId === item.id}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100 disabled:opacity-50"
                        title="Upload image"
                      >
                        <Upload size={12} className="text-SilentKrowd-white" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full border border-SilentKrowd-border bg-transparent px-2 py-1 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(item.id)} className="text-xs text-SilentKrowd-gold hover:underline">Save</button>
                          <button onClick={cancelEdit} className="text-xs text-SilentKrowd-muted hover:underline">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <span className={item.active ? 'text-SilentKrowd-white' : 'text-SilentKrowd-muted line-through'}>{item.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-SilentKrowd-muted">
                    {editingId === item.id ? (
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="border border-SilentKrowd-border bg-transparent px-2 py-1 text-xs text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    ) : (
                      item.category
                    )}
                  </td>
                  <td className="px-4 py-3 text-SilentKrowd-gold">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        min="0"
                        className="w-28 border border-SilentKrowd-border bg-transparent px-2 py-1 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
                      />
                    ) : (
                      `₦${item.price.toLocaleString()}`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`rounded px-2 py-0.5 text-[0.6rem] uppercase tracking-wider ${
                        item.active
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}
                    >
                      {item.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {editingId !== item.id && (
                        <button
                          onClick={() => startEdit(item)}
                          className="text-xs text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-gold"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-SilentKrowd-muted transition-colors hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-SilentKrowd-muted">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}