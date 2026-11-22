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
