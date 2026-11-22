import { useEffect } from 'react'
import { applySiteFont, siteFontFromExtra } from '../lib/siteFont.ts'
import { supabase } from '../lib/supabase.ts'

export function SiteFont() {
  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase
      .from('content_sections')
      .select('title, extra')
      .eq('page', 'site')
      .eq('section_key', 'font')
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        applySiteFont(data ? siteFontFromExtra(data.title, data.extra) : null)
      })
    return () => {
      active = false
    }
  }, [])

  return null
}
