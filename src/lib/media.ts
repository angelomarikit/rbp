import { asset } from './assets.ts'
import { supabase } from './supabase.ts'

export function publicMediaUrl(path: string | null | undefined) {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('/')) return path
  if (path.startsWith('uploads/') && supabase) {
    return supabase.storage.from('storefront-media').getPublicUrl(path).data.publicUrl
  }
  return asset(path)
}

export async function uploadPaymentProof(file: File, orderId: string) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) throw new Error('Use a JPG, PNG, or WebP screenshot.')
  if (file.size > 10 * 1024 * 1024) throw new Error('The screenshot must be 10 MB or smaller.')
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `orders/${orderId}/${crypto.randomUUID()}-${safe}`
  const { error } = await supabase.storage.from('payment-proofs').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function paymentProofUrl(path: string) {
  if (!supabase) return ''
  const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 60 * 60)
  if (error || !data?.signedUrl) return ''
  return data.signedUrl
}

export async function uploadMedia(file: File, folder: string) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `uploads/${folder}/${crypto.randomUUID()}-${safe}`
  const { error } = await supabase.storage.from('storefront-media').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
  })
  if (error) throw error
  return path
}
