import { ASSOCIATION_GALLERY_PHOTO_SIZE } from './gallery.ts'

/** How the Association grid expects uploads to look. */
export const ASSOCIATION_UPLOAD_GUIDE = {
  grid: 'Instagram-style grid: 4 squares per row on desktop, 3 on tablet, 2 on phone.',
  photo: {
    pixels: `${ASSOCIATION_GALLERY_PHOTO_SIZE} × ${ASSOCIATION_GALLERY_PHOTO_SIZE}`,
    aspect: '1:1 square',
    formats: 'JPG, PNG, or WebP',
    maxMb: 12,
    note: 'Photos are center-cropped to a square when you upload so every tile matches.',
  },
  video: {
    pixels: `${ASSOCIATION_GALLERY_PHOTO_SIZE} × ${ASSOCIATION_GALLERY_PHOTO_SIZE} recommended`,
    aspect: '1:1 square (vertical phone clips are cropped in the grid)',
    formats: 'MP4 or WebM',
    maxMb: 50,
    note: 'Keep under 50 MB. Square clips look best in the grid.',
  },
} as const

const PHOTO_MAX_BYTES = ASSOCIATION_UPLOAD_GUIDE.photo.maxMb * 1024 * 1024
const VIDEO_MAX_BYTES = ASSOCIATION_UPLOAD_GUIDE.video.maxMb * 1024 * 1024

export function validateAssociationGalleryUpload(file: File) {
  const kind = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name) ? 'video' : 'image'
  const max = kind === 'video' ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES
  if (file.size > max) {
    const limit = kind === 'video' ? ASSOCIATION_UPLOAD_GUIDE.video.maxMb : ASSOCIATION_UPLOAD_GUIDE.photo.maxMb
    throw new Error(`That file is too large. Stay under ${limit} MB.`)
  }
  return kind
}

/** Center-crop and resize to the Association grid size (photos only). */
export async function normalizeAssociationGalleryImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file)
  const size = ASSOCIATION_GALLERY_PHOTO_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare this image.')

  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const w = bitmap.width * scale
  const h = bitmap.height * scale
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h)
  bitmap.close()

  const keepPng = file.type === 'image/png' || file.type === 'image/webp'
  const mime = keepPng ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not save this image.'))), mime, keepPng ? undefined : 0.9)
  })

  const ext = keepPng ? 'png' : 'jpg'
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '-') || 'association'
  return new File([blob], `${base}-${size}.${ext}`, { type: mime })
}