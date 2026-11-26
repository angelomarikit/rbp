import { asset } from './assets.ts'
import { publicMediaUrl } from './media.ts'

/** Bundled fallbacks when CMS has no client result rows (matches homepage). */
export const CLIENT_RESULT_FALLBACK_PATHS = [
  'showcase/client-nostril-septum.jpg',
  'showcase/client-ear-multiple-piercings.jpg',
  'showcase/client-eyebrow.jpg',
  'showcase/client-lip.jpg',
  'showcase/client-ear-tunnel.jpg',
] as const

export function clientResultFallbackUrls() {
  return CLIENT_RESULT_FALLBACK_PATHS.map((path) => asset(path))
}

type ShowcaseRow = { storage_path: string; placement: string }

/** Same rules as homepage Client Results — home/both placement, not legacy event-only stock paths. */
export function clientResultImageUrls(rows: ShowcaseRow[] | null | undefined, limit = 5): string[] {
  const filtered = (rows ?? []).filter(
    (row) => row.placement === 'home' || !String(row.storage_path).includes('event-client-result'),
  )
  if (!filtered.length) return clientResultFallbackUrls().slice(0, limit)
  return filtered.slice(0, limit).map((row) => publicMediaUrl(row.storage_path))
}

export function displayClientResultSrc(src: string) {
  return src.startsWith('/') || src.startsWith('http') ? src : asset(src)
}