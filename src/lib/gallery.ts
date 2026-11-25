export type GalleryMediaKind = 'image' | 'video'

export type GalleryItem = {
  id: string
  storage_path: string
  caption: string | null
  category: string | null
  published: boolean
  sort_order: number
  media_kind: GalleryMediaKind
}

export const GALLERY_CATEGORIES = [
  { value: 'logo', label: 'Logo' },
  { value: 'members', label: 'Members' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'general', label: 'General' },
] as const

export function mediaKindForFile(file: File): GalleryMediaKind {
  if (file.type.startsWith('video/')) return 'video'
  const lower = file.name.toLowerCase()
  if (/\.(mp4|webm|mov|m4v)$/.test(lower)) return 'video'
  return 'image'
}

export function isVideoGalleryItem(item: Pick<GalleryItem, 'media_kind' | 'storage_path'>) {
  if (item.media_kind === 'video') return true
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(item.storage_path)
}