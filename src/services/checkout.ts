import { supabase } from '@/lib/supabase'
import { callFunction } from '@/services/functions'
import { toKobo } from '@/utils/currency'

export interface CheckoutDetails {
  fullName: string
  phone: string
  email?: string
  deliveryAddress: string
  deliveryInstructions?: string
  couponCode?: string
  idempotencyKey?: string
}

export interface CheckoutLine {
  menu_item_id: number
  name: string
  category: string
  unit_price: number
  quantity: number
}

export interface CreateOrderResult {
  order_id: string
  order_number: string
  subtotal: number
  delivery_fee: number
  discount_amount: number
  total_amount: number
  reference: string
  idempotent?: boolean
}

export async function createOrder(
  details: CheckoutDetails,
  items: CheckoutLine[],
): Promise<CreateOrderResult> {
  return callFunction<CreateOrderResult>('create-order', {
    full_name: details.fullName,
    phone: details.phone,
    email: details.email || undefined,
    delivery_address: details.deliveryAddress,
    delivery_instructions: details.deliveryInstructions || undefined,
    coupon_code: details.couponCode || undefined,
    idempotency_key: details.idempotencyKey || undefined,
    items,
  })
}

export interface VerifyPaymentResult {
  status: 'success' | 'failed'
  order?: unknown
  reason?: string
}

export async function verifyPayment(orderId: string, reference: string): Promise<VerifyPaymentResult> {
  return callFunction<VerifyPaymentResult>('verify-payment', { order_id: orderId, reference })
}

export function openPaystackPopup(options: {
  email: string
  amountNaira: number
  reference: string
  orderNumber: string
}): Promise<{ reference: string } | null> {
  return new Promise((resolve) => {
    if (!window.PaystackPop) {
      console.error('Paystack Inline script (js.paystack.co/v1/inline.js) is not loaded.')
      resolve(null)
      return
    }

    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
    if (!publicKey) {
      console.error('Missing VITE_PAYSTACK_PUBLIC_KEY.')
      resolve(null)
      return
    }

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: options.email,
      amount: toKobo(options.amountNaira),
      ref: options.reference,
      currency: 'NGN',
      metadata: { order_number: options.orderNumber },
      onClose: () => resolve(null),
      callback: (response) => resolve({ reference: response.reference }),
    })

    handler.openIframe()
  })
}

export async function trackOrder(orderNumber: string, phone: string) {
  const { data, error } = await supabase
    .rpc('track_order', { p_order_number: orderNumber, p_phone: phone })
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('No order found with that order number and phone number.')

  return data
}
