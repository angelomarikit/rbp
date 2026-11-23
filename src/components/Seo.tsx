import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { applyDocumentSeo, clipText, DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE, siteOrigin } from '../lib/seo.ts'
import { supabase } from '../lib/supabase.ts'

type PageSeo = { title?: string; description?: string; image?: string; noindex?: boolean }
type SiteSeo = { title: string; description: string; phone: string; email: string; address: string; city: string }

const SeoContext = createContext<(page: PageSeo | null) => void>(() => {})

const PRIVATE = /^\/(admin|account|checkout|login|register|forgot-password|reset-password)(\/|$)/

const PAGE_NAMES: Record<string, string> = {
  '/collections': 'Products',
  '/events': 'Events',
  '/book': 'Book a Piercing',
  '/gallery': 'Gallery',
  '/about': 'About',
  '/contact': 'Contact',
}

export function usePageSeo(page: PageSeo | null) {
  const setPage = useContext(SeoContext)
  const title = page?.title ?? ''
  const description = page?.description ?? ''
  const image = page?.image ?? ''
  const noindex = Boolean(page?.noindex)
  useEffect(() => {
    if (!title && !description && !image && !noindex) {
      setPage(null)
      return () => setPage(null)
    }
    setPage({ title, description, image, noindex })
    return () => setPage(null)
  }, [setPage, title, description, image, noindex])
}

export function SeoProvider({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation()
  const [site, setSite] = useState<SiteSeo>({ title: '', description: '', phone: '', email: '', address: '', city: '' })
  const [page, setPage] = useState<PageSeo | null>(null)

  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('site_settings')
      .select('seo_title, seo_description, business_name, phone, email, address, city')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setSite({
          title: data.seo_title || data.business_name || '',
          description: data.seo_description || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
        })
      })
  }, [])

  useEffect(() => {
    const siteTitle = site.title.trim() || DEFAULT_SITE_TITLE
    const siteDescription = clipText(site.description.trim() || DEFAULT_SITE_DESCRIPTION)
    const category = new URLSearchParams(search).get('category')
    const section = pathname === '/collections' && category ? category : PAGE_NAMES[pathname]
    const privatePage = PRIVATE.test(pathname)
    const title = page?.title?.trim()
      ? `${page.title.trim()} | ${siteTitle}`
      : section
        ? `${section} | ${siteTitle}`
        : siteTitle
    const description = clipText(page?.description?.trim() || siteDescription)
    const origin = siteOrigin()
    applyDocumentSeo({
      title,
      description,
      path: `${pathname}${category && pathname === '/collections' ? `?category=${encodeURIComponent(category)}` : ''}`,
      image: page?.image,
      noindex: privatePage || page?.noindex,
      jsonLd: privatePage || page?.noindex ? null : {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: siteTitle,
        description,
        url: origin || undefined,
        telephone: site.phone || undefined,
        email: site.email || undefined,
        address: site.address || site.city ? {
          '@type': 'PostalAddress',
          streetAddress: site.address || undefined,
          addressLocality: site.city || undefined,
          addressCountry: 'PH',
        } : undefined,
      },
    })
  }, [page, pathname, search, site])

  return <SeoContext.Provider value={setPage}>{children}</SeoContext.Provider>
}
