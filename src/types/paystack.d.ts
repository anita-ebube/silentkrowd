// src/types/paystack.d.ts
export {}

interface PaystackTransactionResponse {
  reference: string
  status: string
  trans: string
  message: string
  transaction: string
  trxref: string
}

interface PaystackSetupOptions {
  key: string
  email: string
  amount: number // kobo
  ref: string
  currency?: string
  metadata?: Record<string, unknown>
  onClose: () => void
  callback: (response: PaystackTransactionResponse) => void
}

interface PaystackHandler {
  openIframe: () => void
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: PaystackSetupOptions) => PaystackHandler
    }
  }
}
