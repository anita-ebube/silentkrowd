// src/pages/admin/Settings.tsx
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { getAllSettings, updateSetting } from '@/services/adminApi'

export default function Settings() {
  const [deliveryFee, setDeliveryFee] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAllSettings()
      .then((settings) => {
        setDeliveryFee(String(settings.delivery_fee ?? 7000))
        setRestaurantName(String(settings.restaurant_name ?? 'SilentKrowd Lounge'))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load settings.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      await Promise.all([
        updateSetting('delivery_fee', Number(deliveryFee)),
        updateSetting('restaurant_name', restaurantName.trim()),
      ])
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-SilentKrowd-muted">Loading…</p>

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-serif text-3xl text-SilentKrowd-white">Settings</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-SilentKrowd-muted">
            Restaurant Name
          </label>
          <input
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className="w-full border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-SilentKrowd-muted">
            Delivery Fee (₦)
          </label>
          <input
            type="number"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            className="w-full border border-SilentKrowd-border bg-transparent px-4 py-3 text-sm text-SilentKrowd-white outline-none focus:border-SilentKrowd-gold/60"
          />
          <p className="mt-1 text-xs text-SilentKrowd-muted">
            Applied to every new order at checkout via the create-order function.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-emerald-400">Settings saved.</p>}

        <Button type="submit" variant="filled" className="mt-2 justify-center" disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </form>
    </div>
  )
}
