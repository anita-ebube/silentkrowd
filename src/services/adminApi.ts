// src/services/adminApi.ts
import { supabase } from '@/lib/supabase'
import { callFunction } from '@/services/functions'
import type {
  OrderStatus,
  Profile,
  Customer,
  OrderWithItems,
  Coupon,
  StaffActivityLog,
  Reservation,
  ReservationStatus,
  ContactMessage,
} from '@/types/database'

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

let dashboardCache: { data: DashboardData | null; expiry: number } = { data: null, expiry: 0 }

export interface DashboardData {
  stats: DashboardStats
  revenue: RevenuePoint[]
  popularFoods: PopularFood[]
  latestOrders: LatestOrder[]
}

export async function getDashboardData(days = 14, foodLimit = 5, orderLimit = 8): Promise<DashboardData> {
  const now = Date.now()
  if (dashboardCache.data && dashboardCache.expiry > now) {
    return dashboardCache.data
  }
  const [stats, revenue, popularFoods, latestOrders] = await Promise.all([
    getDashboardStats(),
    getRevenueSeries(days),
    getPopularFoods(foodLimit),
    getLatestOrders(orderLimit),
  ])
  const data = { stats, revenue, popularFoods, latestOrders }
  dashboardCache = { data, expiry: now + 30_000 }
  return data
}

export interface DashboardStats {
  today_sales: number
  week_sales: number
  month_sales: number
  pending_orders: number
  completed_orders: number
  cancelled_orders: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_dashboard_stats')
  if (error) throw new Error(error.message)
  return data as DashboardStats
}

export interface PopularFood {
  name: string
  category: string
  total_quantity: number
  total_revenue: number
}

export async function getPopularFoods(limit = 5): Promise<PopularFood[]> {
  const { data, error } = await supabase.rpc('get_popular_foods', { p_limit: limit })
  if (error) throw new Error(error.message)
  return (data ?? []) as PopularFood[]
}

export interface RevenuePoint {
  day: string
  revenue: number
}

export async function getRevenueSeries(days = 14): Promise<RevenuePoint[]> {
  const { data, error } = await supabase.rpc('get_revenue_series', { p_days: days })
  if (error) throw new Error(error.message)
  return (data ?? []) as RevenuePoint[]
}

export interface LatestOrder {
  order_number: string
  status: OrderStatus
  total_amount: number
  customer_name: string
  created_at: string
}

export async function getLatestOrders(limit = 8): Promise<LatestOrder[]> {
  const { data, error } = await supabase.rpc('get_latest_orders', { p_limit: limit })
  if (error) throw new Error(error.message)
  return (data ?? []) as LatestOrder[]
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface OrderSearchRow {
  id: string
  order_number: string
  status: OrderStatus
  total_amount: number
  created_at: string
  assigned_staff_id: string | null
  assigned_staff_name: string | null
  customer_name: string
  customer_phone: string
  total_count: number
}

export interface ListOrdersParams {
  search?: string
  status?: OrderStatus | 'all'
  page?: number
  pageSize?: number
}

export async function listOrders({
  search,
  status = 'all',
  page = 1,
  pageSize = 20,
}: ListOrdersParams): Promise<{ rows: OrderSearchRow[]; count: number }> {
  const offset = (page - 1) * pageSize

  const { data, error } = await supabase.rpc('search_orders', {
    p_search: search?.trim() || null,
    p_status: status === 'all' ? null : status,
    p_limit: pageSize,
    p_offset: offset,
  })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as OrderSearchRow[]
  const count = rows[0]?.total_count ?? 0

  return { rows, count }
}

export async function getOrderDetail(orderId: string): Promise<OrderWithItems> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, created_at, assigned_staff_id, cancelled_reason, notes, order_items(id, name, qty, price, category), customer:customers(id, full_name, phone, email), payment:payments(id, reference, amount, status, method)')
    .eq('id', orderId)
    .single()

  if (error) throw new Error(error.message)
  return data as unknown as OrderWithItems
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (error) throw new Error(error.message)
}

export async function assignStaffToOrder(orderId: string, staffId: string | null): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ assigned_staff_id: staffId })
    .eq('id', orderId)
  if (error) throw new Error(error.message)
}

export async function cancelOrder(orderId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', cancelled_reason: reason })
    .eq('id', orderId)
  if (error) throw new Error(error.message)
}

export async function refundOrder(orderId: string, reason?: string): Promise<void> {
  await callFunction('refund-payment', { order_id: orderId, reason })
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface ListCustomersParams {
  search?: string
  page?: number
  pageSize?: number
}

export async function listCustomers({
  search,
  page = 1,
  pageSize = 20,
}: ListCustomersParams): Promise<{ rows: Customer[]; count: number }> {
  let query = supabase
    .from('customers')
    .select('id, full_name, phone, email, total_orders, total_spent, last_order_at, created_at', { count: 'exact' })
    .order('last_order_at', { ascending: false, nullsFirst: false })

  if (search?.trim()) {
    query = query.or(`full_name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await query.range(from, to)

  if (error) throw new Error(error.message)
  return { rows: (data ?? []) as Customer[], count: count ?? 0 }
}

// ---------------------------------------------------------------------------
// Coupons (admin only)
// ---------------------------------------------------------------------------

export async function listCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase.from('coupons').select('id, code, discount_type, discount_value, max_discount, min_order_amount, usage_limit, used_count, active, expires_at, created_at').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Coupon[]
}

export interface CouponInput {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_discount?: number | null
  min_order_amount?: number
  usage_limit?: number | null
  expires_at?: string | null
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .insert({ ...input, code: input.code.trim().toUpperCase() })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Coupon
}

export async function setCouponActive(couponId: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('coupons').update({ active }).eq('id', couponId)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Staff (admin only — profiles table with role = 'staff')
// ---------------------------------------------------------------------------

export async function listStaff(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, status, full_name, email, phone, avatar_url, created_at')
    .eq('role', 'staff')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Profile[]
}

/** All active staff + admins — used for the "assign to" dropdown on orders. */
export async function listAssignableStaff(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, status, full_name, email, phone, avatar_url, created_at')
    .eq('status', 'active')
    .order('full_name')

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Profile[]
}

export interface CreateStaffPayload {
  full_name: string
  email: string
  phone?: string
  password: string
}

export async function createStaff(payload: CreateStaffPayload): Promise<Profile> {
  const result = await callFunction<{ profile: Profile }>('create-staff', { ...payload })
  return result.profile
}

export async function manageStaff(
  action: 'suspend' | 'activate' | 'delete' | 'reset-password',
  staffId: string,
  newPassword?: string,
): Promise<void> {
  await callFunction('manage-staff', { action, staff_id: staffId, new_password: newPassword })
}

export async function getStaffActivity(staffId: string, limit = 20): Promise<StaffActivityLog[]> {
  const { data, error } = await supabase
    .from('staff_activity_logs')
    .select('id, action, target_table, target_id, performed_by, details, created_at')
    .eq('target_table', 'profiles')
    .eq('target_id', staffId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as StaffActivityLog[]
}

// ---------------------------------------------------------------------------
// Settings (admin only for writes; settings table itself is a small
// key/value store seeded in 0005_seed_settings.sql)
// ---------------------------------------------------------------------------

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const { data, error } = await supabase.from('settings').select('value').eq('key', key).maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.value as T) ?? null
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error) throw new Error(error.message)
  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]))
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase.from('settings').upsert({ key, value })
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Reservations
// ---------------------------------------------------------------------------

export async function listReservations(params: {
  search?: string
  status?: ReservationStatus | 'all'
  page?: number
  pageSize?: number
}): Promise<{ rows: Reservation[]; count: number }> {
  const { search, status = 'all', page = 1, pageSize = 20 } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('reservations')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }
  if (search?.trim()) {
    query = query.or(`full_name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
  }

  const { data, error, count } = await query.range(from, to)
  if (error) throw new Error(error.message)
  return { rows: (data ?? []) as Reservation[], count: count ?? 0 }
}

export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Contact Messages
// ---------------------------------------------------------------------------

export async function listContactMessages(params: {
  search?: string
  unreadOnly?: boolean
  page?: number
  pageSize?: number
}): Promise<{ rows: ContactMessage[]; count: number }> {
  const { search, unreadOnly = false, page = 1, pageSize = 20 } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('contact_messages')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (unreadOnly) {
    query = query.eq('read', false)
  }
  if (search?.trim()) {
    query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,subject.ilike.%${search.trim()}%`)
  }

  const { data, error, count } = await query.range(from, to)
  if (error) throw new Error(error.message)
  return { rows: (data ?? []) as ContactMessage[], count: count ?? 0 }
}

export async function markMessageRead(id: string): Promise<void> {
  const { error } = await supabase.from('contact_messages').update({ read: true }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteContactMessage(id: string): Promise<void> {
  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
