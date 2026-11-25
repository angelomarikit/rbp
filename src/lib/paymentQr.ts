export type PaymentQrs = { gcash: string; bpi: string }

export const emptyPaymentQrs: PaymentQrs = { gcash: '', bpi: '' }

export function paymentQrsFromExtra(extra: unknown): PaymentQrs {
  const value = extra as { gcash_qr?: unknown; bpi_qr?: unknown } | null
  return {
    gcash: typeof value?.gcash_qr === 'string' ? value.gcash_qr : '',
    bpi: typeof value?.bpi_qr === 'string' ? value.bpi_qr : '',
  }
}

export function paymentMethodLabel(method: string) {
  if (method === 'gcash') return 'GCash'
  if (method === 'bpi') return 'BPI'
  if (method === 'maya') return 'Maya'
  return method
}
