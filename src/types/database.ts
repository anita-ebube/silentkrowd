// src/types/database.ts
//
// Hand-written mirror of the Supabase schema in supabase/migrations/.
// If you generate real types later with `supabase gen types typescript`,
// this file can be replaced wholesale — nothing here depends on it being
// hand-maintained forever, it's just enough to type the app for now.

export type AppRole = 'admin' | 'staff'
export type StaffStatus = 'active' | 'suspended'

export type MenuCategory = 'food' | 'drinks' | 'wine' | 'spirits' | 'desserts'

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'

export type SimplifiedOrderProgress =
  | 'awaiting_payment'
  | 'order_received'
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: AppRole
  status: StaffStatus
  avatar_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  full_name: string
  phone: string
  email: string | null
  total_orders: number
  total_spent: number
  last_order_at: string | null
  created_at: string
  updated_at: string
}

export interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_discount: number | null
  min_order_amount: number
  usage_limit: number | null
  times_used: number
  active: boolean
  starts_at: string | null
  expires_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  assigned_staff_id: string | null
  status: OrderStatus
  delivery_address: string
  delivery_instructions: string | null
  subtotal: number
  delivery_fee: number
  coupon_id: string | null
  discount_amount: number
  total_amount: number
  cancelled_reason: string | null
  cancelled_at: string | null
  confirmed_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: number
  name: string
  category: MenuCategory
  unit_price: number
  quantity: number
  line_total: number
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  reference: string
  amount: number
  status: PaymentStatus
  gateway_response: string | null
  channel: string | null
  paid_at: string | null
  refunded_at: string | null
  refunded_by: string | null
  raw_verification: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface StaffActivityLog {
  id: string
  actor_id: string | null
  action: string
  target_table: string | null
  target_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

/** Order with its line items joined — the shape most order-detail views want. */
export interface OrderWithItems extends Order {
  order_items: OrderItem[]
  customer: Customer
  payment?: Payment
}

/** Shape returned by the `track_order` RPC (guest order tracking). */
export interface TrackedOrder {
  order_number: string
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  discount_amount: number
  total_amount: number
  delivery_address: string
  created_at: string
  confirmed_at: string | null
  delivered_at: string | null
  items: Array<{
    name: string
    quantity: number
    unit_price: number
    line_total: number
  }>
}
