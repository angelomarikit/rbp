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
    { path: 'branding/body-piercers-association-logo.png', alt: 'The Body Piercers Association of the Philippines' },
    { path: 'partners/dole-ncr.png', alt: 'Department of Labor and Employment, National Capital Region' },
    { path: 'partners/arzey.png', alt: 'Arzey Piercing Studio' },
    { path: 'partners/rbp-logo.png', alt: 'Romell Body Piercing' },
  ],
}

function matchAffiliationLogo(logos: AffiliationLogo[], patterns: RegExp[]) {
  for (const logo of logos) {
    const hay = `${logo.alt} ${logo.path}`.toLowerCase()
    if (patterns.some((pattern) => pattern.test(hay))) return logo
  }
  return null
}

/** RBP (left) and Body Piercers Association (right) marks for the Association page hero. */
export function associationHeroLogos(logos: AffiliationLogo[]) {
  const list = logos.length ? logos : defaultAffiliation.logos
  const association =
    matchAffiliationLogo(list, [/body piercers association/, /association of the philippines/, /bpap/]) ??
    list.find((logo) => /body-piercers|association/i.test(logo.path)) ??
    defaultAffiliation.logos[0]
  const rbpBadge =
    matchAffiliationLogo(list, [/romell/, /\brbp\b/, /rbp-logo/]) ??
    list.find((logo) => /rbp-logo|romell/i.test(logo.path)) ??
    defaultAffiliation.logos.find((logo) => /rbp/i.test(logo.path)) ??
    defaultAffiliation.logos[3]
  return { rbpBadge, associationLogo: association }
}

const ASSOCIATION_HERO_MARK = 'branding/body-piercers-association-logo.png'

/** Prefer the transparent-friendly association mark on the Association hero (not the dark JPEG badge). */
export function associationHeroMarkPath(logo: AffiliationLogo) {
  const hay = `${logo.path} ${logo.alt}`.toLowerCase()
  if (/body piercers|association of the philippines|bpap/i.test(hay) && /\.jpe?g$/i.test(logo.path)) {
    return ASSOCIATION_HERO_MARK
  }
  return logo.path
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
