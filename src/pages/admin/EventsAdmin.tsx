import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.ts'
import { publicMediaUrl } from '../../lib/media.ts'
import { Card, MediaField, Notice, PrimaryButton, QuietButton, TextArea, TextField } from './ui.tsx'

type EventRow = {
  id?: string
  title: string
  summary: string
  body: string
  image_path: string
  event_date: string
  location: string
  kind: 'featured' | 'upcoming'
  published: boolean
}

type Testimonial = { id: string; customer_name: string; quote: string; rating: number; image_path: string | null; published: boolean }
type Shot = { id: string; storage_path: string; placement: string }

const blank: EventRow = { title: '', summary: '', body: '', image_path: '', event_date: '', location: '', kind: 'upcoming', published: true }

export function EventsAdmin() {
  const [hero, setHero] = useState('')
  const [events, setEvents] = useState<EventRow[]>([])
  const [draft, setDraft] = useState<EventRow>(blank)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [quote, setQuote] = useState({ customer_name: '', quote: '', image_path: '', rating: '5' })
  const [shots, setShots] = useState<Shot[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const load = async () => {
    if (!supabase) return
    const [heroRow, eventRows, testimonyRows, shotRows] = await Promise.all([
      supabase.from('content_sections').select('media_path').eq('page', 'events').eq('section_key', 'hero').maybeSingle(),
      supabase.from('events').select('id, title, summary, body, image_path, event_date, location, kind, published').order('sort_order'),
      supabase.from('testimonials').select('id, customer_name, quote, rating, image_path, published').order('sort_order'),
      supabase.from('showcase_items').select('id, storage_path, placement').in('placement', ['events', 'both']).order('sort_order'),
    ])
    const failure = heroRow.error || eventRows.error || testimonyRows.error || shotRows.error
    if (failure) {
      setError(failure.message)
      return
    }
    setHero(heroRow.data?.media_path ?? '')
    setEvents((eventRows.data ?? []).map((row) => ({
      ...row,
      summary: row.summary ?? '',
      image_path: row.image_path ?? '',
      event_date: row.event_date ?? '',
      location: row.location ?? '',
      body: Array.isArray(row.body) ? (row.body as string[]).join('\n\n') : '',
      kind: row.kind as 'featured' | 'upcoming',
    })))
    setTestimonials((testimonyRows.data ?? []) as Testimonial[])
    setShots((shotRows.data ?? []) as Shot[])
  }

  useEffect(() => { void load() }, [])

  const saveHero = async (path: string) => {
    setHero(path)
    setOk(null)
    const { error: saveError } = await supabase!.from('content_sections').upsert(
      { page: 'events', section_key: 'hero', media_path: path, title: 'Client Showcase', subtitle: 'Events &', visible: true, sort_order: 1 },
      { onConflict: 'page,section_key' },
    )
    if (saveError) setError(saveError.message)
    else setOk('Events background saved.')
  }

  const saveEvent = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase || !draft.title.trim()) return
    setError(null)
    setOk(null)
    const payload = {
      title: draft.title.trim(),
      summary: draft.summary,
      body: draft.body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean),
      image_path: draft.image_path || null,
      event_date: draft.event_date,
      location: draft.location,
      kind: draft.kind,
      published: draft.published,
    }
    const result = draft.id
      ? await supabase.from('events').update(payload).eq('id', draft.id)
      : await supabase.from('events').insert(payload)
    if (result.error) setError(result.error.message)
    else {
      setDraft(blank)
      setOk(draft.kind === 'featured' ? 'Featured event saved. It also appears on the homepage.' : 'Upcoming event saved.')
      await load()
    }
  }

  const saveQuote = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase || !quote.customer_name || !quote.quote) return
    setError(null)
    setOk(null)
    const { error: insertError } = await supabase.from('testimonials').insert({
      customer_name: quote.customer_name,
      quote: quote.quote,
      rating: Number(quote.rating) || 5,
      image_path: quote.image_path || null,
      published: true,
      sort_order: testimonials.length + 1,
    })
    if (insertError) setError(insertError.message)
    else {
      setError(null)
      setOk('Quote saved.')
      setQuote({ customer_name: '', quote: '', image_path: '', rating: '5' })
      await load()
    }
  }

  const featured = events.filter((event) => event.kind === 'featured')
  const upcoming = events.filter((event) => event.kind === 'upcoming')

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">Events</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">Featured events also show on the homepage. Upcoming events open their own page when a customer taps them.</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {[
          ['list', '1. Events'],
          ['editor', '2. Write one'],
          ['backdrop', '3. Page photo'],
          ['quotes', '4. Client quotes'],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-[#333] bg-[#161616] px-3 py-1.5 text-sm hover:border-[#FF7900]">{label}</a>
        ))}
      </nav>
      <Notice error={error} ok={ok} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div id="list" className="scroll-mt-4 space-y-5">
          <EventGroup title="On the homepage" hint="These are the featured events." rows={featured} onEdit={setDraft} onRemove={async (id) => { await supabase?.from('events').delete().eq('id', id); await load() }} />
          <EventGroup title="Coming up" hint="Each card opens a detail page." rows={upcoming} onEdit={setDraft} onRemove={async (id) => { await supabase?.from('events').delete().eq('id', id); await load() }} />
          <Card id="quotes" className="scroll-mt-4 space-y-4">
            <h2 className="text-base font-semibold">What clients say</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {testimonials.map((item) => (
                <article key={item.id} className="rounded-xl border border-[#2a2a2a] bg-[#101010] p-3">
                  <div className="flex items-center gap-3">
                    {item.image_path && <img src={publicMediaUrl(item.image_path)} alt="" className="h-10 w-10 rounded-full object-cover" />}
                    <p className="text-sm font-semibold">{item.customer_name}</p>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-[#b5b5b5]">{item.quote}</p>
                  <button type="button" className="mt-2 text-xs text-[#ffb089]" onClick={async () => { await supabase?.from('testimonials').delete().eq('id', item.id); await load() }}>Remove</button>
                </article>
              ))}
            </div>
            <form className="space-y-3 rounded-xl border border-dashed border-[#444] p-3" onSubmit={saveQuote}>
              <p className="text-sm font-medium">Add a quote</p>
              <TextField label="Customer name" value={quote.customer_name} onChange={(event) => setQuote({ ...quote, customer_name: event.target.value })} />
              <TextArea label="What they said" value={quote.quote} onChange={(event) => setQuote({ ...quote, quote: event.target.value })} />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" className={`rounded-full border px-2 py-1 text-xs ${Number(quote.rating) === star ? 'border-[#FF7900] bg-[#2a1608]' : 'border-[#333]'}`} onClick={() => setQuote({ ...quote, rating: String(star) })}>{star} star{star > 1 ? 's' : ''}</button>
                ))}
              </div>
              <MediaField label="Their photo" hint="Square, about 800×800. Optional." folder="testimonials" accept="image/jpeg,image/png,image/webp" value={quote.image_path} onChange={(path) => setQuote({ ...quote, image_path: path })} />
              <PrimaryButton type="submit">Add quote</PrimaryButton>
            </form>
          </Card>
        </div>
        <div className="space-y-5 lg:sticky lg:top-4">
          <Card id="editor" className="scroll-mt-4 space-y-3">
            <h2 className="text-base font-semibold">{draft.id ? 'Edit this event' : 'New event'}</h2>
            <form className="space-y-3" onSubmit={saveEvent}>
              <TextField label="Title" hint="Example: Philippine Tattoo Expo 2025" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              <TextField label="Date" hint="Example: May 16–18, 2025" value={draft.event_date} onChange={(event) => setDraft({ ...draft, event_date: event.target.value })} />
              <TextField label="Place" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDraft({ ...draft, kind: 'featured' })} className={`rounded-xl border px-3 py-2 text-left text-sm ${draft.kind === 'featured' ? 'border-[#FF7900] bg-[#2a1608]' : 'border-[#333]'}`}>
                  <span className="block font-medium">Featured</span>
                  <span className="text-xs text-[#9a9a9a]">Homepage too</span>
                </button>
                <button type="button" onClick={() => setDraft({ ...draft, kind: 'upcoming' })} className={`rounded-xl border px-3 py-2 text-left text-sm ${draft.kind === 'upcoming' ? 'border-[#FF7900] bg-[#2a1608]' : 'border-[#333]'}`}>
                  <span className="block font-medium">Upcoming</span>
                  <span className="text-xs text-[#9a9a9a]">Detail page</span>
                </button>
              </div>
              <TextArea label="Short summary" value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
              <TextArea label="Full story" hint="Leave a blank line between paragraphs." value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
              <MediaField label="Cover photo" hint="Wide photo, about 1600×900." folder="events" accept="image/jpeg,image/png,image/webp" value={draft.image_path} onChange={(path) => setDraft({ ...draft, image_path: path })} />
              <div className="flex gap-2">
                <PrimaryButton type="submit">{draft.id ? 'Update event' : 'Add event'}</PrimaryButton>
                {draft.id && <QuietButton type="button" onClick={() => setDraft(blank)}>Cancel</QuietButton>}
              </div>
            </form>
          </Card>
          <Card id="backdrop" className="scroll-mt-4">
            <h2 className="text-base font-semibold">Big photo at the top</h2>
            <p className="mt-1 text-sm text-[#9a9a9a]">Wide, about 1600×900. This sits behind the Events title.</p>
            <div className="mt-3">
              <MediaField label="Background" hint="JPG, PNG, or WebP." folder="events" accept="image/jpeg,image/png,image/webp" value={hero} onChange={(path) => void saveHero(path)} />
            </div>
          </Card>
          {shots.length > 0 && (
            <p className="text-xs text-[#8d8d8d]">Client photos shared with the homepage are edited under Homepage → Client photos.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function EventGroup({
  title,
  hint,
  rows,
  onEdit,
  onRemove,
}: {
  title: string
  hint: string
  rows: EventRow[]
  onEdit: (event: EventRow) => void
  onRemove: (id: string) => void
}) {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-[#9a9a9a]">{hint}</p>
      </div>
      {rows.length === 0 && <p className="rounded-xl border border-dashed border-[#333] px-3 py-4 text-sm text-[#9a9a9a]">None yet. Use the form to add one.</p>}
      {rows.map((event) => (
        <article key={event.id} className="flex gap-3 rounded-xl border border-[#2a2a2a] bg-[#161616] p-3">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[#0c0c0c]">
            {event.image_path && <img src={publicMediaUrl(event.image_path)} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{event.title}</p>
            <p className="text-xs text-[#9a9a9a]">{event.event_date} · {event.location}</p>
            <div className="mt-2 flex gap-3 text-xs">
              <button type="button" className="text-[#ffb067]" onClick={() => onEdit(event)}>Edit</button>
              <button type="button" className="text-[#ffb089]" onClick={() => event.id && onRemove(event.id)}>Remove</button>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
