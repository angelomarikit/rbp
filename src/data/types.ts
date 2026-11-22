export type ProductSpecs = {
  material?: string
  gauge?: string
  barLength?: string
  gem?: string
  finish?: string
}

export type Product = {
  id: string
  slug: string
  name: string
  priceCents: number
  category: string
  material: string
  imagePath: string
  specs?: ProductSpecs
  description?: string
  reviewCount?: number
  rating?: number
}

export type GemVariant = {
  key: string
  label: string
  color: string
}

export type CartLine = {
  lineId: string
  cartId?: string
  productId: string
  slug: string
  name: string
  priceCents: number
  quantity: number
  imagePath: string
  variantKey?: string
  variantLabel?: string
  material?: string
  sizeLabel?: string
  color?: string
  options?: Record<string, string>
}

export type ShippingMethod = 'standard' | 'express'

export type PaymentMethod = 'gcash' | 'maya'

export type CheckoutForm = {
  fullName: string
  email: string
  phone: string
  province: string
  city: string
  barangay: string
  postalCode: string
  address: string
  paymentMethod: PaymentMethod
  shippingMethod: ShippingMethod
}