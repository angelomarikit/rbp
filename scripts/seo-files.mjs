const PUBLIC_PATHS = ['/', '/collections', '/events', '/book', '/gallery', '/about', '/contact']

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function robotsText(site) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /account/',
    'Disallow: /checkout',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /forgot-password',
    'Disallow: /reset-password',
    '',
    `Sitemap: ${site}/sitemap.xml`,
    '',
  ].join('\n')
}

export async function sitemapDocument(site, env = process.env) {
  const paths = [...PUBLIC_PATHS]
  const base = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const key = env.VITE_SUPABASE_ANON_KEY || ''
  if (base && key) {
    const headers = { apikey: key, Authorization: `Bearer ${key}` }
    const [products, events] = await Promise.all([
      fetch(`${base}/rest/v1/products?select=slug&status=eq.active&published=eq.true`, { headers, signal: AbortSignal.timeout(8000) }).catch(() => null),
      fetch(`${base}/rest/v1/events?select=slug&published=eq.true`, { headers, signal: AbortSignal.timeout(8000) }).catch(() => null),
    ])
    if (products?.ok) {
      const rows = await products.json()
      for (const row of rows) if (row?.slug) paths.push(`/products/${row.slug}`)
    }
    if (events?.ok) {
      const rows = await events.json()
      for (const row of rows) if (row?.slug) paths.push(`/events/${row.slug}`)
    }
  }
  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(site + (path === '/' ? '/' : encodeURI(path)))}</loc></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}
