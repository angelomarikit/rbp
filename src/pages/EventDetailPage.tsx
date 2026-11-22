import { Link, useParams } from 'react-router-dom'
import { OrangeLink } from '../components/ui/Buttons.tsx'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { IconCalendar, IconCalendarLight, IconPin } from '../components/ui/Icons.tsx'
import { rbpPanel } from '../components/ui/panels.ts'
import { ALL_EVENTS, getEventBySlug } from '../data/events.ts'
import { asset } from '../lib/assets.ts'

export function EventDetailPage() {
  const { slug = '' } = useParams()
  const event = getEventBySlug(slug)

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

  const more = ALL_EVENTS.filter((item) => item.slug !== event.slug).slice(0, 3)

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

        <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.28em] text-rbp-cream">Event</p>
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

        <img
          src={asset(event.image)}
          alt=""
          className="mt-8 h-[280px] w-full rounded-rbp border border-rbp-border object-cover sm:h-[420px]"
        />

        <div className="mt-10 space-y-5 text-[17px] leading-relaxed text-white/85">
          {event.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className={`mt-12 px-6 py-8 text-center sm:px-10 ${rbpPanel}`}>
          <p className="flex items-center justify-center gap-2 font-display text-[2rem] leading-none text-rbp-accent">
            <IconCalendar size={22} /> Going to this event?
          </p>
          <p className="mx-auto mt-4 max-w-md text-[14px] text-white/75">
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
                <img src={asset(item.image)} alt="" className="h-[180px] w-full object-cover" />
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
