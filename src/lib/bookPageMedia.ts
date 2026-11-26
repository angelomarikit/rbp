/** Bundled fallbacks when no CMS upload is saved yet. */
export const BOOK_PAGE_DEFAULT_PRICE_LIST = 'references/piercing-price-list-poster.jpg'
export const BOOK_PAGE_DEFAULT_STUDIO = 'banners/book-page-studio-interior.jpg'

export type BookPageImageSpec = {
  title: string
  width: number
  height: number
  aspect: string
  formats: string
  notes: string
}

export const BOOK_PAGE_PRICE_LIST_SPEC: BookPageImageSpec = {
  title: 'Left column — price list poster',
  width: 800,
  height: 1200,
  aspect: '2:3 portrait (tall)',
  formats: 'JPG, PNG, or WebP',
  notes: 'Full piercing price list graphic. Displays up to ~960px wide on large screens; keep text readable.',
}

export const BOOK_PAGE_STUDIO_SPEC: BookPageImageSpec = {
  title: 'Right column — studio photo (below logo)',
  width: 900,
  height: 1100,
  aspect: '~4:5 portrait',
  formats: 'JPG, PNG, or WebP',
  notes: 'Interior or studio shot. Logo above stays the brand mark; only this photo is replaced here.',
}

export function bookPageImagePath(
  stored: string | null | undefined,
  fallback: string,
) {
  const path = stored?.trim()
  return path || fallback
}