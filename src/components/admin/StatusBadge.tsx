// src/components/admin/StatusBadge.tsx
import { cn } from '@/utils/cn'
import type { OrderStatus } from '@/types/database'

const STYLES: Record<OrderStatus, string> = {
  pending_payment: 'bg-white/10 text-white/60',
  paid: 'bg-blue-500/10 text-blue-300',
  confirmed: 'bg-blue-500/10 text-blue-300',
  preparing: 'bg-amber-500/10 text-amber-300',
  ready: 'bg-amber-500/10 text-amber-300',
  out_for_delivery: 'bg-purple-500/10 text-purple-300',
  delivered: 'bg-emerald-500/10 text-emerald-300',
  cancelled: 'bg-red-500/10 text-red-300',
  refunded: 'bg-red-500/10 text-red-300',
}

const LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'pending_payment',
  'paid',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
]

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded px-2.5 py-1 text-xs uppercase tracking-wide',
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  )
}

export function statusLabel(status: OrderStatus) {
  return LABELS[status]
}
