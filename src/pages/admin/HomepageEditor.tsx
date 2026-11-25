import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.ts'
import { isVideoStoragePath, publicMediaUrl } from '../../lib/media.ts'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { Card, MediaField, Notice, PrimaryButton, TextArea, TextField } from './ui.tsx'

type Section = {
  title: string
  subtitle: string
  body: string
  media_path: string
  mobile_media_path: string
  buttons: { label: string; to: string }[]
}

type Collection = { id: string; name: string; featured: boolean; sort_order: number; image_path: string | null }
type Showcase = { id: string; storage_path: string; media_kind: string; caption: string | null; placement: string; published: boolean; sort_order: number }

const emptySection: Section = {
  title: '',
  subtitle: '',
  body: '',
  media_path: '',
  mobile_media_path: '',
  buttons: [
    { label: 'Book a Piercing', to: '/book' },
    { label: 'Shop Jewelry', to: '/collections' },
  ],
}

export function HomepageEditor() {
  const [section, setSection] = useState<Section>(emptySection)
  const [collections, setCollections] = useState<Collection[]>([])
  const [showcase, setShowcase] = useState<Showcase[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!supabase) return
    const [hero, cols, shots] = await Promise.all([
      supabase.from('content_sections').select('title, subtitle, body, media_path, mobile_media_path, buttons').eq('page', 'home').eq('section_key', 'hero').maybeSingle(),
      supabase.from('collections').select('id, name, featured, sort_order, image_path').order('sort_order'),
      supabase.from('showcase_items').select('id, storage_path, media_kind, caption, placement, published, sort_order').in('placement', ['home', 'both']).order('sort_order'),
    ])
    if (hero.error || cols.error || shots.error) {
      setError(hero.error?.message || cols.error?.message || shots.error?.message || 'Could not load the homepage.')
      return
    }
    if (hero.data) {
      const buttons = Array.isArray(hero.data.buttons) ? (hero.data.buttons as { label: string; to: string }[]) : emptySection.buttons
      setSection({
        title: hero.data.title ?? '',
        subtitle: hero.data.subtitle ?? '',
        body: hero.data.body ?? '',
        media_path: hero.data.media_path ?? '',
        mobile_media_path: hero.data.mobile_media_path ?? '',
        buttons: [buttons[0] ?? emptySection.buttons[0], buttons[1] ?? emptySection.buttons[1]],
      })
    }
    setCollections((cols.data ?? []) as Collection[])
    setShowcase((shots.data ?? []) as Showcase[])
  }

  useEffect(() => {
    void load()
  }, [])

  const persistHero = async (next: Section, message: string) => {
    if (!supabase) return false
    setSaving(true)
    setError(null)
    setOk(null)
    const { error: saveError } = await supabase.from('content_sections').upsert(
      {
        page: 'home',
        section_key: 'hero',
        title: next.title,
        subtitle: next.subtitle,
        body: next.body,
        media_path: next.media_path?.trim() || null,
        mobile_media_path: next.mobile_media_path?.trim() || null,
        buttons: next.buttons,
        visible: true,
        sort_order: 1,
      },
      { onConflict: 'page,section_key' },
    )
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return false
    }
    setOk(message)
    return true
  }

  const saveHero = async () => {
    await persistHero(section, 'Homepage hero saved. The storefront will show this background on the next visit.')
  }

  const updateHeroMedia = async (patch: Partial<Pick<Section, 'media_path' | 'mobile_media_path'>>) => {
    const next = { ...section, ...patch }
    setSection(next)
    await persistHero(next, 'Background saved to the live homepage.')
  }

  const saveCollections = async () => {
    if (!supabase) return
    const client = supabase
    setSaving(true)
    setError(null)
    setOk(null)
    const results = await Promise.all(
      collections.map((collection) =>
        client.from('collections').update({ featured: collection.featured, sort_order: collection.sort_order }).eq('id', collection.id),
      ),
    )
    setSaving(false)
    const failed = results.find((result) => result.error)
    if (failed?.error) setError(failed.error.message)
    else setOk('Featured collections saved. Homepage and the collections list share these rows.')
  }

  const addShowcase = async (path: string, kind: 'image' | 'video') => {
    if (!supabase) return
    const { error: insertError } = await supabase.from('showcase_items').insert({
      storage_path: path,
      media_kind: kind,
      placement: 'both',
      published: true,
      sort_order: showcase.length + 1,
    })
    if (insertError) setError(insertError.message)
    else await load()
  }

  const ordered = [...collections].sort((a, b) => a.sort_order - b.sort_order)
  const clientShots = showcase.filter((item) => item.placement === 'home' || !item.storage_path.includes('event-client-result'))

  const moveCollection = (index: number, direction: -1 | 1) => {
    const next = [...ordered]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const copy = [...next]
    const [item] = copy.splice(index, 1)
    copy.splice(target, 0, item)
    setCollections(copy.map((row, rowIndex) => ({ ...row, sort_order: rowIndex + 1 })))
  }

  const setButton = (index: 0 | 1, patch: Partial<{ label: string; to: string }>) => {
    const buttons = [...section.buttons] as Section['buttons']
    buttons[index] = { ...buttons[index], ...patch }
    setSection({ ...section, buttons })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Homepage</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">Change the big opening screen, which jewelry groups show first, and the client photos. Events are edited on the Events page.</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {[
          ['words', '1. Words'],
          ['buttons', '2. Buttons'],
          ['background', '3. Background'],
          ['groups', '4. Jewelry groups'],
          ['clients', '5. Client photos'],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-[#333] bg-[#161616] px-3 py-1.5 text-sm text-[#e8e8e8] hover:border-[#FF7900]">
            {label}
          </a>
        ))}
      </nav>
      {saving ? <LoadingScreen label="Saving" full /> : null}
      <Notice error={error} ok={ok} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Card id="words" className="scroll-mt-4 space-y-4">
            <HomeHeading step="1" title="The words on the opening screen" hint="Title is the large line. Subtitle is the small line above it." />
            <TextField label="Title" hint="Example: Professional Body Piercing & Jewelry" value={section.title} onChange={(event) => setSection({ ...section, title: event.target.value })} />
            <TextField label="Small line above the title" value={section.subtitle} onChange={(event) => setSection({ ...section, subtitle: event.target.value })} />
            <TextArea label="Short description" hint="One or two sentences under the title." value={section.body} onChange={(event) => setSection({ ...section, body: event.target.value })} />
          </Card>
          <Card id="background" className="scroll-mt-4 space-y-4">
            <HomeHeading
              step="3"
              title="Background photo or video"
              hint="Use Computer for laptops and desktop browsers (wide 1920×1080). Phone is optional and only overrides small screens."
            />
            {section.mobile_media_path.trim() &&
            section.media_path.trim() &&
            section.mobile_media_path.trim() !== section.media_path.trim() ? (
              <p className="rounded-lg border border-[#ff7900]/40 bg-[#1a1208] px-3 py-2 text-xs leading-relaxed text-[#ffc899]">
                Desktop visitors use the <strong className="font-semibold text-[#ff7900]">Computer</strong> file. The{' '}
                <strong className="font-semibold text-[#ff7900]">Phone</strong> file plays only on mobile. If the video is under
                Phone only, click &quot;Use phone file for Computer&quot; below so desktops get the same video.
              </p>
            ) : null}
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <MediaField
                label="Computer (desktop & laptop)"
                hint="Upload MP4 or image here for the main homepage background. This is what most visitors see."
                folder="hero"
                accept="image/jpeg,image/png,image/webp,video/mp4"
                value={section.media_path}
                onChange={(path) => void updateHeroMedia({ media_path: path || '' })}
                previewClassName="mt-3 aspect-video w-full rounded-xl object-cover"
              />
              <div className="space-y-2">
                <MediaField
                  label="Phone (mobile only)"
                  hint="Optional tall file for phones. If Computer is empty, this is used everywhere."
                  folder="hero"
                  accept="image/jpeg,image/png,image/webp,video/mp4"
                  value={section.mobile_media_path}
                  onChange={(path) =>
                    void updateHeroMedia(
                      path
                        ? {
                            mobile_media_path: path,
                            ...(!section.media_path.trim() ? { media_path: path } : {}),
                          }
                        : { mobile_media_path: '' },
                    )
                  }
                  previewClassName="mt-3 aspect-[9/16] w-full rounded-xl object-cover"
                />
                {section.mobile_media_path.trim() &&
                section.media_path.trim() !== section.mobile_media_path.trim() ? (
                  <button
                    type="button"
                    className="w-full rounded-lg border border-[#FF7900] bg-[#1a1208] px-3 py-2 text-xs font-semibold text-[#ffb067] hover:bg-[#251808]"
                    onClick={() => void updateHeroMedia({ media_path: section.mobile_media_path })}
                  >
                    Use phone file for Computer{isVideoStoragePath(section.mobile_media_path) ? ' (video)' : ''}
                  </button>
                ) : null}
              </div>
            </div>
          </Card>
          <Card id="groups" className="scroll-mt-4 space-y-4">
            <HomeHeading step="4" title="Jewelry groups on the homepage" hint="Tap a group to show or hide it. Use the arrows to change the order. New groups are created under Collections." />
            <div className="space-y-2">
              {ordered.map((collection, index) => (
                <div key={collection.id} className="flex items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#101010] p-2">
                  <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-[#0c0c0c]">
                    {collection.image_path && <img src={publicMediaUrl(collection.image_path)} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{collection.name}</p>
                  <div className="flex gap-1">
                    <button type="button" className="rounded-lg border border-[#333] px-2 py-1 text-xs" onClick={() => moveCollection(index, -1)} aria-label="Move earlier">Up</button>
                    <button type="button" className="rounded-lg border border-[#333] px-2 py-1 text-xs" onClick={() => moveCollection(index, 1)} aria-label="Move later">Down</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCollections(collections.map((item) => item.id === collection.id ? { ...item, featured: !item.featured } : item))}
                    className={`rounded-full border px-3 py-1 text-xs ${collection.featured ? 'border-[#FF7900] bg-[#2a1608] text-white' : 'border-[#333] text-[#cfcfcf]'}`}
                  >
                    {collection.featured ? 'Showing' : 'Hidden'}
                  </button>
                </div>
              ))}
            </div>
            <PrimaryButton type="button" disabled={saving} onClick={() => void saveCollections()}>Save groups</PrimaryButton>
          </Card>
          <Card id="clients" className="scroll-mt-4 space-y-4">
            <HomeHeading step="5" title="Client photos" hint="Tall photos, about 900×1200. These also appear on the Events page." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {clientShots.map((item) => (
                <figure key={item.id} className="overflow-hidden rounded-xl border border-[#333] bg-[#0c0c0c]">
                  {item.media_kind === 'video' || item.storage_path.endsWith('.mp4') ? (
                    <video src={publicMediaUrl(item.storage_path)} className="aspect-[3/4] w-full object-cover" muted />
                  ) : (
                    <img src={publicMediaUrl(item.storage_path)} alt="" className="aspect-[3/4] w-full object-cover" />
                  )}
                  <figcaption className="px-2 py-2 text-right">
                    <button type="button" className="text-xs text-[#ffb089]" onClick={async () => { await supabase?.from('showcase_items').delete().eq('id', item.id); await load() }}>Remove</button>
                  </figcaption>
                </figure>
              ))}
              <div className="flex aspect-[3/4] flex-col justify-center rounded-xl border border-dashed border-[#444] bg-[#101010] p-3">
                <MediaField label="Add a photo or video" hint="JPG, PNG, WebP, or MP4." folder="showcase" accept="image/jpeg,image/png,image/webp,video/mp4" value="" onChange={(path) => void addShowcase(path, path.endsWith('.mp4') ? 'video' : 'image')} />
              </div>
            </div>
          </Card>
        </div>
        <Card id="buttons" className="scroll-mt-4 space-y-4 lg:sticky lg:top-4">
          <HomeHeading step="2" title="The two buttons" hint="Pick where each button goes. The orange one is the first button." />
          <ButtonFields title="First button" button={section.buttons[0]} onChange={(patch) => setButton(0, patch)} />
          <ButtonFields title="Second button" button={section.buttons[1]} onChange={(patch) => setButton(1, patch)} />
          <PrimaryButton type="button" disabled={saving} onClick={() => void saveHero()}>{saving ? 'Saving…' : 'Save text & buttons'}</PrimaryButton>
          <p className="text-xs text-[#8d8d8d]">Background photo or video saves automatically when you upload. Use this button for the title, description, and buttons.</p>
        </Card>
      </div>
    </div>
  )
}

const buttonPlaces = [
  { label: 'Booking page', to: '/book' },
  { label: 'Shop', to: '/collections' },
  { label: 'Events', to: '/events' },
  { label: 'Association', to: '/association' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

function ButtonFields({
  title,
  button,
  onChange,
}: {
  title: string
  button: { label: string; to: string }
  onChange: (patch: Partial<{ label: string; to: string }>) => void
}) {
  const known = buttonPlaces.some((place) => place.to === button.to)
  return (
    <div className="space-y-3 rounded-xl border border-[#2a2a2a] bg-[#101010] p-3">
      <p className="text-sm font-semibold">{title}</p>
      <TextField label="Words on the button" value={button.label} onChange={(event) => onChange({ label: event.target.value })} />
      <label className="block text-sm font-medium text-[#f0f0f0]">
        Where it opens
        <select className="mt-1.5 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm" value={known ? button.to : 'custom'} onChange={(event) => { if (event.target.value !== 'custom') onChange({ to: event.target.value }) }}>
          {buttonPlaces.map((place) => <option key={place.to} value={place.to}>{place.label}</option>)}
          <option value="custom">Somewhere else</option>
        </select>
      </label>
      {!known && <TextField label="Page address" hint="Example: /book" value={button.to} onChange={(event) => onChange({ to: event.target.value })} />}
    </div>
  )
}

function HomeHeading({ step, title, hint }: { step: string; title: string; hint: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF7900] text-xs font-bold text-black">{step}</span>
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="mt-0.5 text-sm text-[#9a9a9a]">{hint}</p>
      </div>
    </div>
  )
}
