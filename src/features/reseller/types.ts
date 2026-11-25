export type ResellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export type ResellerRecord = {
  id: string
  profile_id: string
  status: ResellerStatus
  discount_code: string | null
  discount_percent: number | null
  province: string
  city: string
  barangay: string
  postal_code: string
  address_line: string
  admin_note: string | null
}

export type ResellerRankingRow = {
  reseller_id: string
  profile_id: string
  full_name: string
  discount_code: string | null
  order_count: number
  total_cents: number
}

export const RESELLER_SELECT =
  'id, profile_id, status, discount_code, discount_percent, province, city, barangay, postal_code, address_line, admin_note'