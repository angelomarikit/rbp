export const DEFAULT_SITE_TITLE = 'Romell Body Piercing'
export const DEFAULT_SITE_DESCRIPTION = 'Expert piercing services, premium body jewelry, and a trusted name in the Philippine piercing community.'
/** Default share preview image (Open Graph / Twitter). */
export const DEFAULT_OG_IMAGE = '/assets/rbp/branding/romell-og.jpg'

export type DocumentSeo = {
  title: string
  description: string
  path: string
  image?: string
  noindex?: boolean
  jsonLd?: Record<string, unknown> | null
}

export function siteOrigin() {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/$/, '')
  if (configured?.startsWith('http') && !configured.includes('your-domain')) return configured
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

export function applyDocumentSeo(seo: DocumentSeo) {
  const origin = siteOrigin()
  const url = origin ? `${origin}${seo.path === '/' ? '/' : seo.path}` : seo.path
  const image = absoluteUrl(seo.image)
  document.title = seo.title
  upsertMeta('name', 'description', seo.description)
  upsertMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow')
  upsertMeta('property', 'og:title', seo.title)
  upsertMeta('property', 'og:description', seo.description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:image', image)
  upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
  upsertMeta('name', 'twitter:title', seo.title)
  upsertMeta('name', 'twitter:description', seo.description)
  upsertMeta('name', 'twitter:image', image)
  upsertLink('canonical', url)
  upsertJsonLd(seo.jsonLd ?? null)
}

export function absoluteUrl(path: string | undefined) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const origin = siteOrigin()
  if (path.startsWith('/') && origin) return `${origin}${path}`
  return ''
}

export function clipText(value: string, max = 160) {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!content) {
    el?.remove()
    return
  }
  const node = el ?? document.createElement('meta')
  node.setAttribute(attr, key)
  node.setAttribute('content', content)
  if (!el) document.head.appendChild(node)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(data: Record<string, unknown> | null) {
  const id = 'rbp-jsonld'
  const existing = document.getElementById(id)
  if (!data) {
    existing?.remove()
    return
  }
  const script = existing ?? document.createElement('script')
  script.id = id
  script.setAttribute('type', 'application/ld+json')
  script.textContent = JSON.stringify(data)
  if (!existing) document.head.appendChild(script)
}
