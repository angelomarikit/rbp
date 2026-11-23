export const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Pending verification',
  proof_submitted: 'Proof submitted',
  verified: 'Payment verified',
  rejected: 'Payment rejected',
}

export const FULFILLMENT_LABELS: Record<string, string> = {
  unfulfilled: 'Unfulfilled',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export function paymentLabel(status: string) {
  return PAYMENT_LABELS[status] ?? status
}

export function fulfillmentLabel(status: string) {
  return FULFILLMENT_LABELS[status] ?? status
}

export function courierLabel(courier: string) {
  if (courier === 'lbc' || courier === 'jnt') return 'LBC'
  return courier
}

export function shipmentNote(note: string | null | undefined) {
  return note?.replaceAll('J&T', 'LBC') ?? ''
}

export function formatWhen(value: string) {
  return new Date(value).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
