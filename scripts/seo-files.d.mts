export function robotsText(site: string): string
export function sitemapDocument(
  site: string,
  env?: { VITE_SUPABASE_URL?: string; VITE_SUPABASE_ANON_KEY?: string },
): Promise<string>
