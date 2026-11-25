import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { storeLogoSrc } from '../../lib/storeLogo.ts'
import { supabase } from '../../lib/supabase.ts'

type SiteBrandingContextValue = {
  logoSrc: string
  logoPath: string | null
  refreshLogo: () => Promise<void>
}

const SiteBrandingContext = createContext<SiteBrandingContextValue | null>(null)

export function SiteBrandingProvider({ children }: { children: ReactNode }) {
  const [logoPath, setLogoPath] = useState<string | null>(null)

  const refreshLogo = async () => {
    if (!supabase) return
    const { data } = await supabase.from('site_settings').select('logo_path').eq('id', 1).maybeSingle()
    setLogoPath(data?.logo_path ?? null)
  }

  useEffect(() => {
    void refreshLogo()
  }, [])

  const logoSrc = storeLogoSrc(logoPath)

  return (
    <SiteBrandingContext.Provider value={{ logoSrc, logoPath, refreshLogo }}>
      {children}
    </SiteBrandingContext.Provider>
  )
}

export function useSiteLogo() {
  const value = useContext(SiteBrandingContext)
  if (!value) {
    return { logoSrc: storeLogoSrc(null), logoPath: null as string | null, refreshLogo: async () => {} }
  }
  return value
}