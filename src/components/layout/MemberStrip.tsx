import { useEffect, useState } from 'react'
import '../../styles/rbp-blackletter.css'
import {
  affiliationFooterTitleParts,
  affiliationFromRow,
  associationHeroMarkPath,
  associationHeroRbpPath,
  defaultAffiliation,
  isBodyPiercersAssociationLogo,
  isRomellRbpLogo,
  type AffiliationContent,
  type AffiliationLogo,
} from '../../lib/affiliation.ts'
import { publicMediaUrl } from '../../lib/media.ts'
import { supabase } from '../../lib/supabase.ts'
import { MemberStripMarquee } from './MemberStripMarquee.tsx'

function logoImagePath(logo: AffiliationLogo) {
  if (isBodyPiercersAssociationLogo(logo)) return associationHeroMarkPath(logo)
  if (isRomellRbpLogo(logo)) return associationHeroRbpPath(logo)
  return logo.path
}

function LogoSet({ logos, copy }: { logos: AffiliationContent['logos']; copy: string }) {
  return (
    <>
      {logos.map((logo) => (
        <div key={`${copy}-${logo.path}`} className="flex h-28 w-44 shrink-0 items-center justify-center px-4 sm:h-32 sm:w-56">
          <img
            src={publicMediaUrl(logoImagePath(logo))}
            alt={logo.alt}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ))}
    </>
  )
}

export function MemberStrip() {
  const [content, setContent] = useState(defaultAffiliation)

  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('content_sections')
      .select('subtitle, title, body, extra')
      .eq('page', 'site')
      .eq('section_key', 'affiliation')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setContent(affiliationFromRow(data))
      })
  }, [])

  const footerTitleParts = affiliationFooterTitleParts(content.title)

  return (
    <section className="w-full border-t border-rbp-border/70 bg-black py-10" aria-label={content.eyebrow || 'Professional affiliation'}>
      <div className="mb-8 px-3 text-center sm:px-4">
        {content.eyebrow && (
          <p className="font-secondary text-[13px] font-semibold uppercase tracking-[0.22em] text-rbp-accent sm:text-[15px] sm:tracking-[0.28em] md:text-[17px]">
            {content.eyebrow}
          </p>
        )}
        {content.title && (
          <p className="rbp-blackletter-text mx-auto mt-3 w-full max-w-4xl text-[22px] leading-[1.12] sm:text-[30px] md:text-[34px] lg:text-[40px]">
            {footerTitleParts ? (
              <>
                <span className="hidden text-rbp-accent md:block">
                  {footerTitleParts.lead} {footerTitleParts.middle} {footerTitleParts.country}
                </span>
                <span className="block text-rbp-accent md:hidden">
                  <span className="block leading-[1.05]">{footerTitleParts.lead}</span>
                  <span className="mt-1 block leading-[1.08]">
                    {footerTitleParts.middle} {footerTitleParts.country}
                  </span>
                </span>
              </>
            ) : (
              content.title
            )}
          </p>
        )}
        {content.tagline && (
          <p className="font-secondary mx-auto mt-2 max-w-md px-1 text-[14px] leading-snug text-rbp-accent sm:max-w-xl sm:text-[16px] md:text-[18px]">
            {content.tagline}
          </p>
        )}
      </div>
      {content.logos.length > 0 && (
        <div className="relative isolate w-full overflow-hidden [touch-action:pan-y]">
          <MemberStripMarquee trackKey={content.logos.map((l) => l.path).join('|')}>
            <LogoSet logos={content.logos} copy="a" />
            <LogoSet logos={content.logos} copy="b" />
          </MemberStripMarquee>
        </div>
      )}
    </section>
  )
}
