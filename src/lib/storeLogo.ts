import { LOGO } from './assets.ts'
import { publicMediaUrl } from './media.ts'

/** Logo shown in the header and admin preview. Falls back to the bundled nav logo. */
export function storeLogoSrc(logoPath?: string | null) {
  const trimmed = logoPath?.trim()
  if (!trimmed) return LOGO
  if (!trimmed.startsWith('uploads/branding/')) return LOGO
  const url = publicMediaUrl(trimmed)
  return url || LOGO
}

export function isCustomStoreLogo(logoPath?: string | null) {
  return Boolean(logoPath?.trim().startsWith('uploads/branding/'))
}