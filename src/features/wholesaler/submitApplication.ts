import { friendlyError } from '../../lib/friendlyError.ts'
import { supabase } from '../../lib/supabase.ts'

export async function submitWholesalerApplication(input: {
  province: string
  city: string
  barangay: string
  postalCode: string
  address: string
  phone: string
}) {
  if (!supabase) return { error: 'Accounts are not available right now.' }
  const { error } = await supabase.rpc('register_reseller_profile', {
    p_province: input.province.trim(),
    p_city: input.city.trim(),
    p_barangay: input.barangay.trim(),
    p_postal_code: input.postalCode.trim(),
    p_address_line: input.address.trim(),
    p_phone: input.phone.trim(),
  })
  if (error) {
    return {
      error: friendlyError(
        error,
        'The wholesaler application could not be saved. Sign in and try again, or ask the studio to run migration 024 on Supabase.',
      ),
    }
  }
  return { error: null }
}