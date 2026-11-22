export type EventCard = {
  slug: string
  title: string
  image: string
  date: string
  location: string
  verified: boolean
  summary: string
  body: string[]
}

export const FEATURED_EVENTS: EventCard[] = [
  {
    slug: 'philippine-tattoo-expo-2025',
    title: 'Philippine Tattoo Expo 2025',
    image: 'events/featured-event-1.jpg',
    date: 'May 16–18, 2025',
    location: 'SMX Convention Center, Pasay',
    verified: false,
    summary: 'Romell Body Piercing joins the Philippine Tattoo Expo with a studio booth, jewelry, and live piercing.',
    body: [
      'Romell Body Piercing is on the floor at the Philippine Tattoo Expo 2025, held at SMX Convention Center in Pasay from May 16 to 18.',
      'The booth carries the studio’s jewelry selection and a place to talk through placements, aftercare, and what to expect before you sit for a piercing. Visitors can meet the team, look through pieces in person, and book a time at the studio.',
      'The expo brings tattoo artists, piercers, and collectors into one hall. RBP’s space is set up the same way the studio works at home: clean setup, clear guidance, and jewelry chosen for everyday wear.',
    ],
  },
  {
    slug: 'rbp-body-piercing-seminar',
    title: 'RBP Body Piercing Seminar',
    image: 'events/featured-event-2.jpg',
    date: 'Mar 22, 2025',
    location: 'Quezon City, Metro Manila',
    verified: false,
    summary: 'A one-day seminar in Quezon City on studio practice, jewelry, and client care.',
    body: [
      'The RBP Body Piercing Seminar is a one-day session in Quezon City on March 22, 2025.',
      'The day is for piercers and studio staff who want a closer look at how Romell Body Piercing runs a service: consultation, jewelry selection, and the way a client is walked through healing.',
      'Seats are limited. Use the booking page to request a place, and the studio will confirm the schedule and what to bring.',
    ],
  },
  {
    slug: 'body-piercers-association-convention',
    title: 'Body Piercers Association Convention',
    image: 'events/featured-event-3.jpg',
    date: 'Feb 8–9, 2025',
    location: 'Manila, Philippines',
    verified: false,
    summary: 'RBP takes part in the Body Piercers Association convention in Manila.',
    body: [
      'Romell Body Piercing joins the Body Piercers Association of the Philippines for its convention in Manila on February 8 and 9, 2025.',
      'The convention is where member studios compare practice, talk through standards, and spend time with the people who keep professional piercing consistent across the country.',
      'RBP is a member of the association. The studio’s commitment on the floor is the same one posted at the bottom of this site: professionalism, safety, and excellence.',
    ],
  },
]

export const UPCOMING_EVENTS: EventCard[] = [
  {
    slug: 'pbf-tattoo-piercing-expo',
    title: 'PBF Tattoo & Piercing Expo',
    image: 'events/events-hero.jpg',
    date: 'Jan 23–25, 2026',
    location: 'To be announced',
    verified: false,
    summary: 'RBP is scheduled for the PBF Tattoo & Piercing Expo in January 2026.',
    body: [
      'Romell Body Piercing is lined up for the PBF Tattoo & Piercing Expo, January 23 to 25, 2026.',
      'Booth details and the hall location will be posted here once the organizer confirms them. If you want a reminder or a studio appointment around those dates, send a booking request and mention the expo.',
    ],
  },
  {
    slug: 'rbp-piercing-workshop',
    title: 'RBP Piercing Workshop',
    image: 'events/featured-event-2.jpg',
    date: 'Feb 14, 2026',
    location: 'Quezon City, Metro Manila',
    verified: false,
    summary: 'A hands-on workshop at the studio on February 14, 2026.',
    body: [
      'The RBP Piercing Workshop is set for February 14, 2026 in Quezon City.',
      'It is a smaller room than the expo booth: a chance to see how the studio prepares a piercing, chooses jewelry, and talks a client through the days after.',
      'Request a seat through the booking form. The studio will reply with the time and what the day covers.',
    ],
  },
  {
    slug: 'manila-tattoo-convention',
    title: 'Manila Tattoo Convention',
    image: 'events/featured-event-1.jpg',
    date: 'Mar 27–29, 2026',
    location: 'Manila, Philippines',
    verified: false,
    summary: 'RBP returns to a Manila convention floor from March 27 to 29, 2026.',
    body: [
      'Romell Body Piercing will be at the Manila Tattoo Convention from March 27 to 29, 2026.',
      'The booth is the same idea as the 2025 expo: jewelry on the table, the team on the floor, and time to talk through a piercing before you book it at the studio.',
      'Venue notes will be added when the organizer publishes them. Until then, a booking request is the fastest way to ask about appointments around the convention weekend.',
    ],
  },
]

export const ALL_EVENTS: EventCard[] = [...FEATURED_EVENTS, ...UPCOMING_EVENTS]

export function getEventBySlug(slug: string): EventCard | undefined {
  return ALL_EVENTS.find((event) => event.slug === slug)
}

/** @deprecated Use UPCOMING_EVENTS */
export const UPCOMING_PLACEHOLDERS = UPCOMING_EVENTS.map((event) => ({
  title: event.title,
  date: event.date,
}))
