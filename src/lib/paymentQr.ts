export type PaymentQrs = { gcash: string; maya: string }

export const emptyPaymentQrs: PaymentQrs = { gcash: '', maya: '' }

export function paymentQrsFromExtra(extra: unknown): PaymentQrs {
  const value = extra as { gcash_qr?: unknown; maya_qr?: unknown } | null
  return {
    gcash: typeof value?.gcash_qr === 'string' ? value.gcash_qr : '',
    maya: typeof value?.maya_qr === 'string' ? value.maya_qr : '',
  }
}
