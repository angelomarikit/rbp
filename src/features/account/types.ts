export type AccountOrderItem = {
  id: string
  product_name: string
  variant_key: string | null
  quantity: number
  unit_price_cents: number
}

export type ShipmentEvent = {
  id: string
  status: string
  note: string | null
  created_at: string
}

export type AccountShipment = {
  id: string
  courier: string
  origin_city: string
  destination_summary: string | null
  tracking_number: string | null
  status: string
  booked_with_courier: boolean
  shipment_events: ShipmentEvent[]
}

export type AccountOrder = {
  id: string
  order_number: string | null
  status: string
  payment_status: string
  fulfillment_status: string
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  payment_method: string
  shipping_address: Record<string, string> | null
  created_at: string
  order_items: AccountOrderItem[]
  shipments: AccountShipment[]
}

export type CustomerAddress = {
  id: string
  label: string | null
  recipient_name: string
  phone: string
  province: string
  city: string
  barangay: string
  postal_code: string
  address_line: string
  is_default: boolean
}

export const ORDER_SELECT = `
  id, order_number, status, payment_status, fulfillment_status,
  subtotal_cents, shipping_cents, total_cents, payment_method,
  shipping_address, created_at,
  order_items (id, product_name, variant_key, quantity, unit_price_cents),
  shipments (
    id, courier, origin_city, destination_summary, tracking_number, status, booked_with_courier,
    shipment_events (id, status, note, created_at)
  )
`
