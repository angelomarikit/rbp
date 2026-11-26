import { useEffect, useState } from 'react'
import { AutoplayVideo } from '../components/media/AutoplayVideo.tsx'
import { Link } from 'react-router-dom'
import { CollectionCard } from '../components/commerce/CollectionCard.tsx'
import { OrangeLink } from '../components/ui/Buttons.tsx'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { IconCalendar, IconCalendarLight, IconCart, IconPin } from '../components/ui/Icons.tsx'
import { FEATURED_EVENTS } from '../data/events.ts'
import { asset } from '../lib/assets.ts'
import { heroUsesVideo, resolveHeroMedia } from '../lib/heroMedia.ts'
import { publicMediaUrl } from '../lib/media.ts'
import { clientResultImageUrls, clientResultFallbackUrls, displayClientResultSrc } from '../lib/clientShowcase.ts'
import { supabase } from '../lib/supabase.ts'

const collections = [
  { title: 'Navel Jewelry', image: 'products/product-01.jpg', category: 'Navel Jewelry' },
  { title: 'Tongue Barbells', image: 'products/product-07.jpg', category: 'Tongue Barbells' },
  { title: 'Hinged Clickers', image: 'products/product-02.jpg', category: 'Hinged Clickers' },
  { title: 'Segment Rings', image: 'products/product-06.jpg', category: 'Segment Rings' },
  { title: 'Eyebrow Jewelry', image: 'products/product-05.jpg', category: 'Eyebrow' },
  { title: 'Ear Jewelry', image: 'products/product-09.jpg', category: 'Ear Jewelry' },
]

const defaultHeroTitle = 'Professional Body Piercing & Jewelry'

export function HomePage() {
  const [collectionCards, setCollectionCards] = useState(collections)
  const [results, setResults] = useState(clientResultFallbackUrls)
  const [featured, setFeatured] = useState(FEATURED_EVENTS.map((event) => ({
    slug: event.slug,
    title: event.title,
    image: asset(event.image),
    date: event.date,
    location: event.location,
  })))
  const [hero, setHero] = useState({
    title: defaultHeroTitle,
    subtitle: 'Romell Body Piercing',
    body: 'Expert piercing services, premium body jewelry, and a trusted name in the Philippine piercing community.',
    mediaPath: null as string | null,
    mobileMediaPath: null as string | null,
    mediaVersion: null as string | null,
    buttons: [
      { label: 'Book a Piercing', to: '/book' },
      { label: 'Shop Jewelry', to: '/collections' },
    ],
  })
  const [heroLoaded, setHeroLoaded] = useState(!supabase)
  const [useMobileHero, setUseMobileHero] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setUseMobileHero(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const loadHome = () => {
    if (!supabase) return
    void Promise.all([
      supabase
        .from('content_sections')
        .select('title, subtitle, body, media_path, mobile_media_path, buttons, updated_at')
        .eq('page', 'home')
        .eq('section_key', 'hero')
        .maybeSingle(),
      supabase.from('collections').select('name, image_path, featured').eq('status', 'active').order('featured', { ascending: false }).order('sort_order'),
      supabase.from('showcase_items').select('storage_path, placement').eq('published', true).in('placement', ['home', 'both']).order('sort_order'),
      supabase.from('events').select('slug, title, image_path, event_date, location').eq('kind', 'featured').eq('published', true).order('sort_order'),
    ]).then(([heroRow, collectionRows, shotRows, eventRows]) => {
      if (heroRow.data) {
        const buttons = Array.isArray(heroRow.data.buttons) ? (heroRow.data.buttons as { label: string; to: string }[]) : hero.buttons
        setHero({
          title: heroRow.data.title || defaultHeroTitle,
          subtitle: heroRow.data.subtitle || 'Romell Body Piercing',
          body: heroRow.data.body || hero.body,
          mediaPath: (heroRow.data.media_path as string | null) ?? null,
          mobileMediaPath: (heroRow.data.mobile_media_path as string | null) ?? null,
          mediaVersion: (heroRow.data.updated_at as string | null) ?? null,
          buttons: [buttons[0] ?? hero.buttons[0], buttons[1] ?? hero.buttons[1]],
        })
      }
      setHeroLoaded(true)
      if (collectionRows.data?.length) {
        const seen = new Set<string>()
        setCollectionCards(collectionRows.data.flatMap((row) => {
          const name = row.name as string
          if (seen.has(name)) return []
          seen.add(name)
          return [{ title: name, image: publicMediaUrl(row.image_path as string), category: name }]
        }))
      }
      setResults(clientResultImageUrls(shotRows.data as { storage_path: string; placement: string }[] | null))
      if (eventRows.data?.length) {
        setFeatured(eventRows.data.map((row) => ({
          slug: row.slug as string,
          title: row.title as string,
          image: publicMediaUrl(row.image_path as string),
          date: (row.event_date as string) || '',
          location: (row.location as string) || '',
        })))
      }
    })
  }

  useEffect(() => {
    loadHome()
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadHome()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const designedTitle = hero.title === defaultHeroTitle
  const heroMedia = heroLoaded
    ? resolveHeroMedia(hero.mediaPath, hero.mobileMediaPath, useMobileHero, hero.mediaVersion)
    : ''
  const heroIsVideo = heroUsesVideo(hero.mediaPath, hero.mobileMediaPath, useMobileHero)

  return (
    <div className="w-full bg-black">
      <section className="relative min-h-[70vh] w-full overflow-hidden lg:min-h-[78vh]">
        {heroLoaded && heroMedia ? (
          heroIsVideo ? (
            <AutoplayVideo src={heroMedia} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <img key={heroMedia} className="absolute inset-0 h-full w-full object-cover" src={heroMedia} alt="" />
          )
        ) : (
          <div className="absolute inset-0 bg-black" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
        <div className="relative z-10 flex min-h-[70vh] flex-col justify-center px-6 py-16 sm:px-12 lg:min-h-[78vh] lg:max-w-[720px] lg:px-20">
          <p className="font-secondary mb-8 text-[15px] font-semibold uppercase tracking-[0.28em] text-rbp-cream sm:text-[16px] sm:tracking-[0.32em] md:text-[17px]">
            {hero.subtitle}
          </p>
          <GothicHeading as="h1" className="text-[3.1rem] leading-[0.78] sm:text-[4.2rem] xl:text-[5rem]">
            {designedTitle ? (
              <>
                <span className="block text-rbp-accent">Professional</span>
                <span className="block text-rbp-accent">Body Piercing</span>
                <span className="block text-rbp-accent">&amp; Jewelry</span>
              </>
            ) : (
              <span className="block text-rbp-accent">{hero.title}</span>
            )}
          </GothicHeading>
          <p className="font-secondary mt-6 max-w-md text-[15px] leading-relaxed text-white/90">{hero.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <OrangeLink to={hero.buttons[0].to} className="gap-2 px-5 py-2.5 font-semibold">
              <IconCalendar size={16} /> {hero.buttons[0].label}
            </OrangeLink>
            <Link
              to={hero.buttons[1].to}
              className="inline-flex items-center gap-2 rounded-rbp border border-rbp-accent-bright bg-black/70 px-5 py-2.5 text-sm font-medium text-white"
            >
              <IconCart size={16} /> {hero.buttons[1].label}
            </Link>
          </div>
        </div>
        <div className="header-glow absolute bottom-0 left-0" />
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <SectionTitle>Featured Collections</SectionTitle>
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-6">
          {collectionCards.map((c) => (
            <CollectionCard key={c.title} title={c.title} image={c.image.startsWith('/') || c.image.startsWith('http') ? c.image : c.image} category={c.category} />
          ))}
        </div>
      </section>

      <section className="border-y border-rbp-border/70 px-5 py-16 text-center sm:px-8 lg:px-10 lg:py-20">
        <GothicHeading className="mb-8 text-[2.2rem] text-rbp-accent">Client Results</GothicHeading>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-5">
          {results.map((src) => (
            <img
              key={src}
              src={displayClientResultSrc(src)}
              alt="Client piercing result"
              className="aspect-[3/4] w-full rounded-[10px] border border-rbp-border/60 object-cover"
            />
          ))}
        </div>
      </section>

      <section className="px-5 py-16 text-center sm:px-8 lg:px-10 lg:py-20">
        <GothicHeading className="mb-8 text-[2.2rem] text-rbp-accent">Events & Community</GothicHeading>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 text-left sm:grid-cols-3">
          {featured.map((event) => (
            <Link
              key={event.title}
              to={`/events/${event.slug}`}
              className="overflow-hidden rounded-rbp border border-rbp-border bg-black transition hover:border-rbp-accent hover:shadow-[0_0_16px_rgba(255,122,0,0.28)]"
            >
              <img src={event.image} alt={event.title} className="h-[200px] w-full object-cover" />
              <div className="p-4">
                <p className="text-[16px] font-bold leading-tight text-white">{event.title}</p>
                <p className="mt-2 flex items-center gap-1 text-[12px] text-white/80">
                  <IconCalendarLight size={14} /> {event.date}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[12px] text-white/80">
                  <IconPin size={14} /> {event.location}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="relative overflow-hidden px-5 py-20 text-center">
        <Ornament side="left" />
        <Ornament side="right" />
        <p className="font-secondary text-[13px] font-medium uppercase tracking-[0.35em] text-rbp-cream">
          Piercing <span className="text-rbp-accent">•</span> Jewelry <span className="text-rbp-accent">•</span> Events{' '}
          <span className="text-rbp-accent">•</span> Community
        </p>
        <div className="mx-auto my-6 h-px w-40 bg-gradient-to-r from-transparent via-rbp-accent to-transparent" />
        <OrangeLink to="/collections" className="relative font-semibold">
          Explore All Collections →
        </OrangeLink>
      </footer>
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="h-[2px] w-16 bg-gradient-to-r from-transparent to-rbp-accent sm:w-28" />
      <GothicHeading className="text-center text-[2rem] text-rbp-accent sm:text-[2.4rem]">{children}</GothicHeading>
      <span className="h-[2px] w-16 bg-gradient-to-l from-transparent to-rbp-accent sm:w-28" />
    </div>
  )
}

function Ornament({ side }: { side: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 90"
      className={`pointer-events-none absolute bottom-2 hidden h-16 w-44 text-rbp-accent opacity-80 lg:block ${
        side === 'left' ? 'left-2' : 'right-2 -scale-x-100'
      }`}
    >
      <path
        d="M20 70c30-8 40-28 28-46 18 10 42 8 62-6-6 22 8 36 30 40-24 6-28 22-18 34"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="168" cy="48" r="16" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M158 44c4-8 16-8 20 0M160 52c4 6 12 6 16 0" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="162" cy="46" r="1.2" fill="currentColor" />
      <circle cx="174" cy="46" r="1.2" fill="currentColor" />
    </svg>
  )
}
