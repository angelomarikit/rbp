import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { OrangeLink, OutlineButton } from '../components/ui/Buttons.tsx'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { IconCalendar, IconCalendarLight, IconChevron, IconPin } from '../components/ui/Icons.tsx'
import { FEATURED_EVENTS, UPCOMING_EVENTS, type EventCard } from '../data/events.ts'
import { asset } from '../lib/assets.ts'
import { publicMediaUrl } from '../lib/media.ts'
import { supabase } from '../lib/supabase.ts'

const showcaseImages = [
  'showcase/event-client-result-1.jpg',
  'showcase/event-client-result-2.jpg',
  'showcase/event-client-result-3.jpg',
  'showcase/event-client-result-4.jpg',
  'showcase/event-client-result-5.jpg',
  'showcase/event-client-result-6.jpg',
]

const testimonials = [
  {
    quote: 'Super professional and clean process. The piercing healed really well!',
    name: 'Bianca T.',
  },
  {
    quote: "The best piercing experience I've had. Highly recommended for quality and safety.",
    name: 'Mark R.',
  },
  {
    quote: 'Amazing service and wide selection of jewelry. Will definitely come back!',
    name: 'Camille S.',
  },
]

export function EventsPage() {
  const [slide, setSlide] = useState(0)
  const [heroImage, setHeroImage] = useState(asset('events/events-hero.jpg'))
  const [featured, setFeatured] = useState(FEATURED_EVENTS)
  const [upcoming, setUpcoming] = useState(UPCOMING_EVENTS)
  const [shots, setShots] = useState(showcaseImages.map((src) => asset(src)))
  const [quotes, setQuotes] = useState(testimonials.map((item) => ({ ...item, image: '' })))
  const visible = 5
  const maxSlide = Math.max(0, shots.length - visible)

  useEffect(() => {
    if (!supabase) return
    void Promise.all([
      supabase.from('content_sections').select('media_path').eq('page', 'events').eq('section_key', 'hero').maybeSingle(),
      supabase.from('events').select('slug, title, summary, image_path, event_date, location, kind').eq('published', true).order('sort_order'),
      supabase.from('showcase_items').select('storage_path, placement').eq('published', true).in('placement', ['events', 'both']).order('sort_order'),
      supabase.from('testimonials').select('customer_name, quote, image_path').eq('published', true).order('sort_order'),
    ]).then(([hero, events, showcase, testimony]) => {
      if (hero.data?.media_path) setHeroImage(publicMediaUrl(hero.data.media_path))
      if (events.data?.length) {
        const rows = events.data.map((row) => ({
          slug: row.slug as string,
          title: row.title as string,
          summary: (row.summary as string) || '',
          image: publicMediaUrl(row.image_path as string),
          date: (row.event_date as string) || '',
          location: (row.location as string) || '',
          kind: row.kind as string,
          verified: false,
          body: [] as string[],
        }))
        const featuredRows: EventCard[] = rows.filter((row) => row.kind === 'featured')
        const upcomingRows: EventCard[] = rows.filter((row) => row.kind === 'upcoming')
        if (featuredRows.length) setFeatured(featuredRows)
        if (upcomingRows.length) setUpcoming(upcomingRows)
      }
      const eventShots = (showcase.data ?? []).filter((row) => row.placement === 'events' || String(row.storage_path).includes('event-client-result') || String(row.storage_path).startsWith('uploads/'))
      if (eventShots.length) setShots(eventShots.map((row) => publicMediaUrl(row.storage_path as string)))
      if (testimony.data?.length) {
        setQuotes(testimony.data.map((row) => ({
          name: row.customer_name as string,
          quote: row.quote as string,
          image: publicMediaUrl(row.image_path as string),
        })))
      }
    })
  }, [])

  return (
    <div className="w-full bg-black">
      <section className="relative min-h-[420px] w-full overflow-hidden lg:min-h-[520px]">
        <img
          src={heroImage}
          alt="Romell Body Piercing expo booth"
          className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/10" />
        <div className="relative z-10 flex min-h-[420px] max-w-2xl flex-col justify-center px-6 py-16 lg:min-h-[520px] lg:px-16 lg:py-20">
          <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-white/70">Events &</p>
          <GothicHeading as="h1" className="mt-3 text-[3.6rem] leading-[0.85] text-rbp-accent sm:text-[4.8rem]">
            Client Showcase
          </GothicHeading>
          <div className="mt-5 h-[3px] w-48 bg-gradient-to-r from-rbp-accent to-transparent" />
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/80">
            Take a closer look at our events, piercing work, and the community that continues to support the RBP
            movement.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <OrangeLink to="/book" className="gap-2 font-semibold">
              <IconCalendar size={16} /> Book a Piercing
            </OrangeLink>
            <OutlineButton onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}>
              View Gallery
            </OutlineButton>
          </div>
        </div>
        <div className="header-glow absolute bottom-0 left-0" />
      </section>

      <section className="px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mb-12 flex items-center justify-center gap-5">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-rbp-accent sm:w-24" />
          <GothicHeading className="text-center text-[2.6rem] sm:text-[3.2rem]">Featured Events</GothicHeading>
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-rbp-accent sm:w-24" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((ev) => (
            <Link
              key={ev.title}
              to={`/events/${ev.slug}`}
              className="group block overflow-hidden rounded-rbp border border-rbp-border bg-black transition duration-300 hover:-translate-y-1 hover:border-rbp-accent hover:shadow-[0_12px_32px_rgba(255,121,0,0.18)]"
            >
              <img src={ev.image.startsWith('/') || ev.image.startsWith('http') ? ev.image : asset(ev.image)} alt="" className="h-[220px] w-full object-cover sm:h-[260px]" />
              <div className="px-5 py-5">
                <p className="text-[18px] font-bold leading-snug text-white group-hover:text-rbp-accent">{ev.title}</p>
                <p className="mt-3 flex items-center gap-2 text-[13px] text-white/70">
                  <IconCalendarLight size={14} /> {ev.date}
                </p>
                <p className="mt-1 flex items-center gap-2 text-[13px] text-white/70">
                  <IconPin size={14} /> {ev.location}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-20">
          <div className="mb-10 flex items-center justify-center gap-5">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-rbp-accent sm:w-24" />
            <GothicHeading className="text-center text-[2.4rem] sm:text-[3rem]">Upcoming Events</GothicHeading>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-rbp-accent sm:w-24" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {upcoming.map((u) => (
              <Link
                key={u.slug}
                to={`/events/${u.slug}`}
                className="group overflow-hidden rounded-rbp border border-rbp-border bg-black transition duration-300 hover:-translate-y-1 hover:border-rbp-accent hover:shadow-[0_12px_32px_rgba(255,121,0,0.18)]"
              >
                <div className="relative">
                  <img src={u.image.startsWith('/') || u.image.startsWith('http') ? u.image : asset(u.image)} alt="" className="h-[200px] w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-full bg-rbp-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-black">
                    Upcoming
                  </span>
                </div>
                <div className="px-5 py-5">
                  <p className="text-[18px] font-bold leading-snug text-white group-hover:text-rbp-accent">{u.title}</p>
                  <p className="mt-3 flex items-center gap-2 text-[13px] text-white/70">
                    <IconCalendarLight size={14} /> {u.date}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-[13px] text-white/70">
                    <IconPin size={14} /> {u.location}
                  </p>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/55">{u.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="showcase" className="border-t border-rbp-border/60 px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <GothicHeading className="text-center text-[2.8rem] sm:text-[3.4rem]">Client Showcase</GothicHeading>
        <p className="mb-10 mt-4 text-center text-[12px] uppercase tracking-[0.28em] text-white/55">
          Real Clients · Real Piercings · Real Results
        </p>
        <div className="relative flex items-center gap-4">
          <button
            type="button"
            aria-label="Previous"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-rbp-border text-rbp-accent"
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
          >
            <IconChevron direction="left" />
          </button>
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {shots.slice(slide, slide + visible).map((src) => (
              <img key={src} src={src} alt="" className="h-[220px] w-full rounded-rbp border border-rbp-border object-cover sm:h-[280px]" />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-rbp-border text-rbp-accent"
            onClick={() => setSlide((s) => Math.min(maxSlide, s + 1))}
          >
            <IconChevron direction="right" />
          </button>
        </div>
      </section>

      <section className="border-t border-rbp-border/60 px-6 py-16 lg:px-12 lg:py-24">
        <GothicHeading className="text-center text-[2.6rem] leading-none sm:text-[3.2rem]">What Our Clients Say</GothicHeading>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {quotes.map((t) => (
            <article key={t.name} className="rounded-rbp border border-rbp-border bg-black px-6 py-7 text-[15px] leading-relaxed">
              {t.image && <img src={t.image} alt="" className="mb-4 h-16 w-16 rounded-full object-cover" />}
              <p className="text-white/90">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-5 tracking-widest text-rbp-accent">★★★★★</p>
              <p className="mt-2 text-[13px] text-white/60">– {t.name}</p>
            </article>
          ))}
        </div>
        <aside className="mx-auto mt-10 max-w-xl rounded-rbp border border-rbp-accent bg-[#120c06] px-8 py-8 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-[2rem] leading-none text-rbp-accent">
            <IconCalendarLight size={22} /> Book Your Piercing Now
          </p>
          <p className="mt-4 text-[14px] text-white/75">Consultation · Proper Guidance · Aftercare Support</p>
          <OrangeLink to="/book" className="mt-6 font-semibold">
            Book an Appointment →
          </OrangeLink>
        </aside>
      </section>
    </div>
  )
}