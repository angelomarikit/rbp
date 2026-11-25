import { asset } from './assets.ts'
import { isVideoMediaUrl, isVideoStoragePath, publicMediaUrl } from './media.ts'

const DEFAULT_HERO_PATH = 'video/homepage-hero.mp4'

export function isHeroVideoUrl(url: string) {
  return isVideoMediaUrl(url)
}

export function isHeroVideoPath(path: string | null | undefined) {
  return isVideoStoragePath(path)
}

export function heroUsesVideo(
  mediaPath: string | null | undefined,
  mobilePath: string | null | undefined,
  useMobileLayout: boolean,
) {
  const picked = pickHeroStoragePath(mediaPath, mobilePath, useMobileLayout)
  if (picked) return isVideoStoragePath(picked)
  return isVideoStoragePath(DEFAULT_HERO_PATH)
}

/** Public URL for hero background; optional cacheKey busts browser/CDN after CMS updates. */
export function heroMediaDisplayUrl(storagePath: string | null | undefined, cacheKey?: string | null) {
  const trimmed = storagePath?.trim()
  const path = trimmed || DEFAULT_HERO_PATH
  const base = publicMediaUrl(path)
  if (!cacheKey || !trimmed?.startsWith('uploads/')) return base
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}v=${encodeURIComponent(cacheKey)}`
}

export function pickHeroStoragePath(
  mediaPath: string | null | undefined,
  mobilePath: string | null | undefined,
  useMobileLayout: boolean,
) {
  const desktop = mediaPath?.trim() ?? ''
  const mobile = mobilePath?.trim() ?? ''
  if (useMobileLayout && mobile) return mobile
  if (desktop) return desktop
  if (mobile) return mobile
  return null
}

export function resolveHeroMedia(
  mediaPath: string | null | undefined,
  mobilePath: string | null | undefined,
  useMobileLayout: boolean,
  cacheKey?: string | null,
) {
  const picked = pickHeroStoragePath(mediaPath, mobilePath, useMobileLayout)
  if (!picked) return heroMediaDisplayUrl(null, cacheKey)
  return heroMediaDisplayUrl(picked, cacheKey)
}

export const defaultHeroAsset = asset(DEFAULT_HERO_PATH)