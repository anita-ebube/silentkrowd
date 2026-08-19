// src/services/adminApi.ts
import { supabase } from '@/lib/supabase'
import { callFunction } from '@/services/functions'
import type {
  OrderStatus,
  Profile,
  Customer,
  OrderWithItems,
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
    .select('id, order_number, status, total_amount, subtotal, delivery_fee, delivery_address, delivery_instructions, assigned_staff_id, cancelled_reason, created_at, order_items(id, name, quantity, unit_price, line_total, category), customer:customers(id, full_name, phone, email), payment:payments(id, reference, amount, status)')
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

// ---------------------------------------------------------------------------
// Gallery Images
// ---------------------------------------------------------------------------

export interface GalleryImage {
  id: string
  src: string
  sort_order: number
  created_at: string
  updated_at: string
}

export async function listGalleryImages(): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('id, src, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as GalleryImage[]
}

export async function uploadGalleryImage(file: File): Promise<GalleryImage> {
  const fileExt = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`
  const filePath = `gallery/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('gallery-images')
    .upload(filePath, file, { upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = supabase.storage
    .from('gallery-images')
    .getPublicUrl(filePath)

  // Get current max sort_order
  const { data: maxRow } = await supabase
    .from('gallery_images')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (maxRow?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('gallery_images')
    .insert({ src: urlData.publicUrl, sort_order: nextOrder })
    .select('id, src, sort_order, created_at, updated_at')
    .single()

  if (error) throw new Error(error.message)
  return data as GalleryImage
}

export async function updateGalleryImage(
  id: string,
  updates: Partial<Pick<GalleryImage, 'sort_order'>>,
): Promise<void> {
  const { error } = await supabase
    .from('gallery_images')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteGalleryImage(id: string): Promise<void> {
  // Get the image first to find the storage path
  const { data: img, error: fetchError } = await supabase
    .from('gallery_images')
    .select('src')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  // Delete from storage
  const urlParts = img.src.split('/')
  const storagePath = urlParts.slice(urlParts.indexOf('gallery')).join('/')

  await supabase.storage.from('gallery-images').remove([storagePath])

  // Delete from table
  const { error } = await supabase.from('gallery_images').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderGalleryImages(
  orderedIds: string[],
): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase.from('gallery_images').update({ sort_order: index }).eq('id', id),
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  if (firstError) throw new Error(firstError.error!.message)
}

// ---------------------------------------------------------------------------
// Menu Items
// ---------------------------------------------------------------------------

export interface MenuItemRow {
  id: number
  name: string
  category: string
  price: number
  image: string | null
  active: boolean
  created_at: string
}

export async function listMenuItems(): Promise<MenuItemRow[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, category, price, image, active, created_at')
    .order('id', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as MenuItemRow[]
}

export async function createMenuItem(
  name: string,
  category: string,
  price: number,
  file?: File | null,
): Promise<MenuItemRow> {
  if (file && file.size > 1 * 1024 * 1024) {
    throw new Error('Image must be under 1 MB.')
  }

  let image: string | null = null

  if (file) {
    const fileExt = file.name.split('.').pop() ?? 'jpg'
    const fileName = `menu/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, file, { upsert: false })

    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName)

    image = urlData.publicUrl
  }

  // Get next id
  const { data: maxRow } = await supabase
    .from('menu_items')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextId = (maxRow?.id ?? 160) + 1

  const { data, error } = await supabase
    .from('menu_items')
    .insert({ id: nextId, name, category, price, image, active: true })
    .select('id, name, category, price, image, active, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data as MenuItemRow
}

export async function updateMenuItem(
  id: number,
  updates: Partial<Pick<MenuItemRow, 'name' | 'category' | 'price' | 'active'>>,
): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteMenuItem(id: number): Promise<void> {
  const { data: item, error: fetchError } = await supabase
    .from('menu_items')
    .select('image')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  // Delete from storage if image exists
  if (item.image) {
    const urlParts = item.image.split('/')
    const storagePath = urlParts.slice(urlParts.indexOf('menu')).join('/')
    await supabase.storage.from('menu-images').remove([storagePath])
  }

  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateMenuItemImage(
  id: number,
  file: File,
): Promise<string> {
  if (file.size > 1 * 1024 * 1024) {
    throw new Error('Image must be under 1 MB.')
  }

  // Delete old image if exists
  const { data: item } = await supabase
    .from('menu_items')
    .select('image')
    .eq('id', id)
    .single()

  if (item?.image) {
    const urlParts = item.image.split('/')
    const storagePath = urlParts.slice(urlParts.indexOf('menu')).join('/')
    await supabase.storage.from('menu-images').remove([storagePath])
  }

  const fileExt = file.name.split('.').pop() ?? 'jpg'
  const fileName = `menu/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(fileName, file, { upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = supabase.storage
    .from('menu-images')
    .getPublicUrl(fileName)

  const imageUrl = urlData.publicUrl

  const { error } = await supabase
    .from('menu_items')
    .update({ image: imageUrl })
    .eq('id', id)

  if (error) throw new Error(error.message)

  return imageUrl
}
