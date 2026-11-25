import { useEffect, useState } from 'react'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { useSiteLogo } from '../features/site/SiteBrandingProvider.tsx'
import {
  affiliationFromRow,
  associationHeroLogos,
  associationHeroMarkPath,
  defaultAffiliation,
} from '../lib/affiliation.ts'
import { isVideoGalleryItem, type GalleryItem } from '../lib/gallery.ts'
import { publicMediaUrl } from '../lib/media.ts'
import { supabase } from '../lib/supabase.ts'

function AssociationMediaTile({
  item,
  onOpen,
}: {
  item: GalleryItem
  onOpen: () => void
}) {
  const video = isVideoGalleryItem(item)
  const src = publicMediaUrl(item.storage_path)

  return (
    <button
      type="button"
      className="group relative aspect-square w-full overflow-hidden bg-[#0a0a0a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rbp-accent"
      onClick={onOpen}
      aria-label={item.caption?.trim() || (video ? 'Play video' : 'View photo')}
    >
      {video ? (
        <video src={src} className="h-full w-full object-cover" muted playsInline preload="metadata" />
      ) : (
        <img src={src} alt={item.caption?.trim() || ''} className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
      )}
      {video ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/65 text-white">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      ) : null}
    </button>
  )
}

function AssociationHeroLogo({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain drop-shadow-[0_0_24px_rgba(255,121,0,0.15)] ${className}`}
      loading="eager"
    />
  )
}

export function AssociationPage() {
  const { logoSrc: storeLogoSrc } = useSiteLogo()
  const [content, setContent] = useState(defaultAffiliation)
  const [items, setItems] = useState<GalleryItem[]>([])
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  useEffect(() => {
    void import('./association-title.css')
  }, [])

  useEffect(() => {
    if (!supabase) return
    void Promise.all([
      supabase
        .from('content_sections')
        .select('subtitle, title, body, extra')
        .eq('page', 'site')
        .eq('section_key', 'affiliation')
        .maybeSingle(),
      supabase
        .from('gallery_items')
        .select('id, storage_path, caption, category, published, sort_order, media_kind')
        .eq('published', true)
        .order('sort_order', { ascending: true }),
    ]).then(([section, gallery]) => {
      if (section.data) setContent(affiliationFromRow(section.data))
      if (gallery.data) {
        setItems(
          (gallery.data as GalleryItem[]).map((row) => ({
            ...row,
            media_kind: row.media_kind === 'video' ? 'video' : 'image',
          })),
        )
      }
    })
  }, [])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [lightbox])

  const { rbpBadge, associationLogo } = associationHeroLogos(content.logos)
  const rbpHeroSrc = storeLogoSrc || publicMediaUrl(rbpBadge.path)
  const associationHeroSrc = publicMediaUrl(associationHeroMarkPath(associationLogo))

  return (
    <div className="bg-black pb-16">
      <div className="px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          {content.eyebrow && (
            <p className="text-center font-secondary text-[12px] font-semibold uppercase tracking-[0.32em] text-rbp-cream">
              {content.eyebrow}
            </p>
          )}

          <div className="mt-6 grid w-full grid-cols-1 place-items-center gap-6 sm:mt-8 lg:grid-cols-[minmax(10rem,12.5rem)_minmax(0,26rem)_minmax(10rem,12.5rem)] lg:items-center lg:gap-x-1 xl:grid-cols-[minmax(12rem,14rem)_minmax(0,30rem)_minmax(12rem,14rem)] xl:gap-x-3">
            <AssociationHeroLogo
              src={rbpHeroSrc}
              alt={rbpBadge.alt || 'Romell Body Piercing'}
              className="order-2 h-32 w-32 sm:h-40 sm:w-40 lg:order-1 lg:h-44 lg:w-44 xl:h-52 xl:w-52"
            />

            <div className="order-1 text-center lg:order-2 lg:px-1">
              <h1 className="association-hero-title text-[2.2rem] leading-[0.9] text-rbp-accent sm:text-[3.2rem] lg:text-[3.35rem] xl:text-[3.6rem]">
                {content.title}
              </h1>
              <div className="mx-auto mt-6 h-[3px] w-48 bg-gradient-to-r from-transparent via-rbp-accent to-transparent" />
              {content.tagline && (
                <p className="font-secondary mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-white/85">{content.tagline}</p>
              )}
            </div>

            <AssociationHeroLogo
              src={associationHeroSrc}
              alt={associationLogo.alt || content.title}
              className="association-bpap-logo order-3 h-32 w-32 sm:h-40 sm:w-40 lg:h-44 lg:w-44 xl:h-52 xl:w-52"
            />
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-1 sm:px-2" aria-label="Association gallery">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <AssociationMediaTile key={item.id} item={item} onOpen={() => setLightbox(item)} />
            ))}
          </div>
        </section>
      ) : (
        <p className="px-5 text-center text-sm text-white/50">Gallery coming soon.</p>
      )}

      {lightbox ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full border border-white/20 px-3 py-1 text-sm text-white hover:border-rbp-accent"
            onClick={() => setLightbox(null)}
          >
            Close
          </button>
          <div className="max-h-[85vh] max-w-5xl" onClick={(event) => event.stopPropagation()}>
            {isVideoGalleryItem(lightbox) ? (
              <video
                src={publicMediaUrl(lightbox.storage_path)}
                className="max-h-[85vh] w-full rounded-lg"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={publicMediaUrl(lightbox.storage_path)}
                alt={lightbox.caption ?? ''}
                className="max-h-[85vh] w-full rounded-lg object-contain"
              />
            )}
            {lightbox.caption?.trim() ? (
              <p className="mt-3 text-center text-sm text-white/80">{lightbox.caption}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function AboutPage() {
  const [title, setTitle] = useState('About')
  const [body, setBody] = useState('')
  const [image, setImage] = useState('')
  const [video, setVideo] = useState('')

  useEffect(() => {
    if (!supabase) return
    void supabase.from('content_sections').select('title, body, media_path, extra').eq('page', 'about').eq('section_key', 'main').maybeSingle().then(({ data }) => {
      if (!data) return
      setTitle(data.title || 'About')
      setBody(data.body || '')
      setImage(data.media_path || '')
      setVideo((data.extra as { video_path?: string } | null)?.video_path || '')
    })
  }, [])

  return (
    <div className="mx-auto max-w-3xl bg-black px-5 py-14">
      <GothicHeading as="h1" className="text-[3rem]">{title}</GothicHeading>
      {image && <img src={publicMediaUrl(image)} alt="" className="mt-6 aspect-[4/5] w-full rounded-rbp border border-rbp-border object-cover" />}
      {video && <video src={publicMediaUrl(video)} className="mt-6 w-full rounded-rbp" controls />}
      <p className="font-secondary mt-6 whitespace-pre-line text-[15px] leading-relaxed text-white/80">{body}</p>
    </div>
  )
}

export function ContactPage() {
  const [title, setTitle] = useState('Contact')
  const [body, setBody] = useState('')
  const [details, setDetails] = useState({ phone: '', email: '', address: '', city: '' })

  useEffect(() => {
    if (!supabase) return
    void Promise.all([
      supabase.from('content_sections').select('title, body').eq('page', 'contact').eq('section_key', 'main').maybeSingle(),
      supabase.from('site_settings').select('phone, email, address, city').eq('id', 1).maybeSingle(),
    ]).then(([section, settings]) => {
      if (section.data) {
        setTitle(section.data.title || 'Contact')
        setBody(section.data.body || '')
      }
      if (settings.data) {
        setDetails({
          phone: settings.data.phone || '',
          email: settings.data.email || '',
          address: settings.data.address || '',
          city: settings.data.city || '',
        })
      }
    })
  }, [])

  return (
    <div className="mx-auto max-w-xl bg-black px-5 py-14 text-center">
      <GothicHeading as="h1" className="text-[3rem]">{title}</GothicHeading>
      <p className="font-secondary mt-4 text-[15px] text-white/80">{body}</p>
      <div className="mt-6 space-y-1 text-sm text-rbp-cream">
        {details.phone && <p>{details.phone}</p>}
        {details.email && <p>{details.email}</p>}
        {details.address && <p>{details.address}</p>}
        {details.city && <p>{details.city}</p>}
      </div>
    </div>
  )
}