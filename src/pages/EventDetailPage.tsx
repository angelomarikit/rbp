import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePageSeo } from '../components/Seo.tsx'
import { OrangeLink } from '../components/ui/Buttons.tsx'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { IconCalendar, IconCalendarLight, IconPin } from '../components/ui/Icons.tsx'
import { LoadingScreen } from '../components/ui/LoadingScreen.tsx'
import { rbpPanel } from '../components/ui/panels.ts'
import { getEventBySlug } from '../data/events.ts'
import { publicMediaUrl } from '../lib/media.ts'
import { supabase } from '../lib/supabase.ts'

type EventView = {
  slug: string
  title: string
  image: string
  date: string
  location: string
  body: string[]
}

function fromLocal(slug: string): EventView | null {
  const event = getEventBySlug(slug)
  if (!event) return null
  return { slug: event.slug, title: event.title, image: event.image, date: event.date, location: event.location, body: event.body }
}

function fromRow(row: { slug: string; title: string; summary: string | null; body: unknown; image_path: string | null; event_date: string | null; location: string | null }): EventView {
  const body = Array.isArray(row.body) ? row.body.filter((part): part is string => typeof part === 'string' && part.trim().length > 0) : []
  return {
    slug: row.slug,
    title: row.title,
    image: row.image_path ?? '',
    date: row.event_date ?? '',
    location: row.location ?? '',
    body: body.length ? body : row.summary ? [row.summary] : [],
  }
}

export function EventDetailPage() {
  const { slug = '' } = useParams()
  const [event, setEvent] = useState<EventView | null>(() => fromLocal(slug))
  const [more, setMore] = useState<EventView[]>([])
  const [ready, setReady] = useState(false)
  usePageSeo(
    event
      ? { title: event.title, description: event.body[0], image: event.image ? publicMediaUrl(event.image) : '' }
      : ready
        ? { title: 'Event not found', noindex: true }
        : null,
  )

  useEffect(() => {
    const local = fromLocal(slug)
    setEvent(local)
    setReady(false)
    if (!supabase || !slug) {
      setReady(true)
      return
    }
    let active = true
    void supabase
      .from('events')
      .select('slug, title, summary, body, image_path, event_date, location, published')
      .eq('slug', slug)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!active) return
        if (data?.published) setEvent(fromRow(data))
        else if (!local) setEvent(null)
        const others = await supabase!
          .from('events')
          .select('slug, title, summary, body, image_path, event_date, location')
          .eq('published', true)
          .neq('slug', slug)
          .order('sort_order')
          .limit(3)
        if (!active) return
        if (others.data?.length) setMore(others.data.map((row) => fromRow(row)))
        setReady(true)
      })
    return () => {
      active = false
    }
  }, [slug])

  if (!ready && !event) return <LoadingScreen label="Opening the event" full />

  if (!event) {
    return (
      <div className="px-6 py-20 text-center">
        <GothicHeading as="h1" className="text-[3rem]">
          Event not found
        </GothicHeading>
        <Link to="/events" className="mt-6 inline-block text-rbp-accent">
          Back to events
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full bg-black">
      <article className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:py-16">
        <nav className="flex flex-wrap items-center gap-2 text-[13px] text-white/55">
          <Link to="/" className="hover:text-white">
            Home
          </Link>
          <span>/</span>
          <Link to="/events" className="hover:text-white">
            Events
          </Link>
          <span>/</span>
          <span className="text-rbp-accent">{event.title}</span>
        </nav>

        <p className="font-secondary mt-8 text-[12px] font-semibold uppercase tracking-[0.28em] text-rbp-cream">Event</p>
        <GothicHeading as="h1" className="mt-3 text-[3.2rem] leading-[0.88] sm:text-[4.2rem]">
          {event.title}
        </GothicHeading>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-white/75">
          <p className="flex items-center gap-2">
            <IconCalendarLight size={16} /> {event.date}
          </p>
          <p className="flex items-center gap-2">
            <IconPin size={16} /> {event.location}
          </p>
        </div>

        {event.image ? (
          <img
            src={publicMediaUrl(event.image)}
            alt=""
            className="mt-8 h-[280px] w-full rounded-rbp border border-rbp-border object-cover sm:h-[420px]"
          />
        ) : null}

        <div className="font-secondary mt-10 space-y-5 text-[17px] leading-relaxed text-white/85">
          {event.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className={`mt-12 px-6 py-8 text-center sm:px-10 ${rbpPanel}`}>
          <p className="flex items-center justify-center gap-2 font-display text-[2rem] leading-none text-rbp-accent">
            <IconCalendar size={22} /> Going to this event?
          </p>
          <p className="font-secondary mx-auto mt-4 max-w-md text-[14px] text-white/75">
            Request a studio appointment and mention {event.title}. The team will confirm the time with you.
          </p>
          <OrangeLink to="/book" className="mt-6 font-semibold">
            Book an Appointment →
          </OrangeLink>
        </div>
      </article>

      <section className="border-t border-rbp-border/60 px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <GothicHeading className="text-center text-[2.4rem]">More Events</GothicHeading>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {more.map((item) => (
              <Link
                key={item.slug}
                to={`/events/${item.slug}`}
                className="overflow-hidden rounded-rbp border border-rbp-border bg-black transition hover:-translate-y-1 hover:border-rbp-accent"
              >
                {item.image ? <img src={publicMediaUrl(item.image)} alt="" className="h-[180px] w-full object-cover" /> : null}
                <div className="px-4 py-4">
                  <p className="text-[16px] font-bold text-white">{item.title}</p>
                  <p className="mt-2 text-[13px] text-white/60">{item.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
