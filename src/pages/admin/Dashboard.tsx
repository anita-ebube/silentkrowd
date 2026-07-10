// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { formatNaira } from '@/utils/currency'
import { StatusBadge } from '@/components/admin/StatusBadge'
import {
  getDashboardStats,
  getPopularFoods,
  getRevenueSeries,
  getLatestOrders,
  type DashboardStats,
  type PopularFood,
  type RevenuePoint,
  type LatestOrder,
} from '@/services/adminApi'

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-SilentKrowd-border p-5">
      <p className="mb-1 text-xs uppercase tracking-[0.15em] text-SilentKrowd-muted">{label}</p>
      <p className="font-serif text-2xl text-SilentKrowd-white">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [popularFoods, setPopularFoods] = useState<PopularFood[]>([])
  const [latestOrders, setLatestOrders] = useState<LatestOrder[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [statsResult, revenueResult, foodsResult, ordersResult] = await Promise.all([
          getDashboardStats(),
          getRevenueSeries(14),
          getPopularFoods(5),
          getLatestOrders(8),
        ])
        if (cancelled) return
        setStats(statsResult)
        setRevenue(revenueResult)
        setPopularFoods(foodsResult)
        setLatestOrders(ordersResult)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load dashboard.')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <h1 className="mb-1 font-serif text-3xl text-SilentKrowd-white">
        Welcome, {profile?.full_name}
      </h1>
      <p className="mb-8 text-sm text-SilentKrowd-muted">Here's how the lounge is doing.</p>

      {error && <p className="mb-6 text-sm text-red-400">{error}</p>}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Today's Sales" value={stats ? formatNaira(stats.today_sales) : '—'} />
        <StatCard label="Weekly Sales" value={stats ? formatNaira(stats.week_sales) : '—'} />
        <StatCard label="Monthly Sales" value={stats ? formatNaira(stats.month_sales) : '—'} />
        <StatCard label="Pending Orders" value={stats ? String(stats.pending_orders) : '—'} />
        <StatCard label="Completed Orders" value={stats ? String(stats.completed_orders) : '—'} />
        <StatCard label="Cancelled Orders" value={stats ? String(stats.cancelled_orders) : '—'} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="border border-SilentKrowd-border p-5 lg:col-span-2">
          <p className="mb-4 text-xs uppercase tracking-[0.15em] text-SilentKrowd-muted">
            Revenue — Last 14 Days
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A227" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#C9A227" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
              <XAxis
                dataKey="day"
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                stroke="#ffffff60"
                fontSize={11}
              />
              <YAxis stroke="#ffffff60" fontSize={11} tickFormatter={(v) => formatNaira(v)} width={90} />
              <Tooltip
                formatter={(value: number) => formatNaira(value)}
                labelFormatter={(d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                contentStyle={{ background: '#1a1a1a', border: '1px solid #ffffff20' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#C9A227" fill="url(#revenueFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-SilentKrowd-border p-5">
          <p className="mb-4 text-xs uppercase tracking-[0.15em] text-SilentKrowd-muted">
            Popular Foods (30 days)
          </p>
          <div className="flex flex-col gap-3">
            {popularFoods.length === 0 && <p className="text-sm text-SilentKrowd-muted">No sales yet.</p>}
            {popularFoods.map((food) => (
              <div key={food.name} className="flex items-center justify-between text-sm">
                <span className="text-SilentKrowd-white">{food.name}</span>
                <span className="text-SilentKrowd-muted">{food.total_quantity} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-SilentKrowd-border p-5">
        <p className="mb-4 text-xs uppercase tracking-[0.15em] text-SilentKrowd-muted">Latest Orders</p>
        <div className="flex flex-col divide-y divide-SilentKrowd-border">
          {latestOrders.length === 0 && <p className="py-3 text-sm text-SilentKrowd-muted">No orders yet.</p>}
          {latestOrders.map((order) => (
            <div key={order.order_number} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="text-SilentKrowd-white">{order.order_number}</p>
                <p className="text-SilentKrowd-muted">{order.customer_name}</p>
              </div>
              <StatusBadge status={order.status} />
              <span className="text-SilentKrowd-gold">{formatNaira(order.total_amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
