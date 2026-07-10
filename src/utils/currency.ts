// src/utils/currency.ts

const formatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

export function formatNaira(amount: number): string {
  return formatter.format(amount)
}

/** Paystack (and most gateways) charge in the currency's smallest unit — kobo for NGN. */
export function toKobo(nairaAmount: number): number {
  return Math.round(nairaAmount * 100)
}
