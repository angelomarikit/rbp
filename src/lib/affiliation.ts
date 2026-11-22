export type AffiliationLogo = { path: string; alt: string }

export type AffiliationContent = {
  eyebrow: string
  title: string
  tagline: string
  logos: AffiliationLogo[]
}

export const defaultAffiliation: AffiliationContent = {
  eyebrow: 'Professional Affiliation',
  title: 'The Body Piercers Association of the Philippines',
  tagline: 'Committed to Professionalism, Safety & Excellence',
  logos: [
    { path: 'partners/body-piercers-association.jpg', alt: 'The Body Piercers Association of the Philippines' },
    { path: 'partners/dole-ncr.png', alt: 'Department of Labor and Employment, National Capital Region' },
    { path: 'partners/arzey.png', alt: 'Arzey Piercing Studio' },
    { path: 'partners/rbp-logo.png', alt: 'Romell Body Piercing' },
  ],
}

export function affiliationFromRow(row: { subtitle: string | null; title: string | null; body: string | null; extra: unknown } | null): AffiliationContent {
  if (!row) return defaultAffiliation
  const extra = row.extra as { logos?: unknown } | null
  const logos = Array.isArray(extra?.logos)
    ? extra.logos.flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const logo = item as { path?: unknown; alt?: unknown }
        if (typeof logo.path !== 'string' || !logo.path) return []
        return [{ path: logo.path, alt: typeof logo.alt === 'string' ? logo.alt : '' }]
      })
    : defaultAffiliation.logos
  return {
    eyebrow: row.subtitle ?? defaultAffiliation.eyebrow,
    title: row.title ?? defaultAffiliation.title,
    tagline: row.body ?? defaultAffiliation.tagline,
    logos,
  }
}
