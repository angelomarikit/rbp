import { useEffect, useState } from 'react'
import { affiliationFromRow, defaultAffiliation, type AffiliationContent } from '../../lib/affiliation.ts'
import { supabase } from '../../lib/supabase.ts'
import { publicMediaUrl, uploadMedia } from '../../lib/media.ts'
import { Card, MediaField, Notice, PrimaryButton, TextArea, TextField } from './ui.tsx'

type GalleryItem = { id: string; storage_path: string; caption: string | null; category: string | null; published: boolean; sort_order: number }

export function GalleryAdmin() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const { data, error: queryError } = await supabase!.from('gallery_items').select('id, storage_path, caption, category, published, sort_order').order('sort_order')
    if (queryError) setError(queryError.message)
    else setItems((data ?? []) as GalleryItem[])
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Gallery</h1>
          <p className="mt-1 max-w-xl text-sm text-[#9a9a9a]">Square photos, like an Instagram grid. Choose several files at once. They are stored here, not as outside links.</p>
        </div>
        <label className="cursor-pointer rounded-lg bg-[#FF7900] px-4 py-2 text-sm font-semibold text-black">
          {busy ? 'Uploading…' : 'Add photos'}
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={async (event) => {
              const files = [...(event.target.files ?? [])]
              event.target.value = ''
              if (!supabase || files.length === 0) return
              setBusy(true)
              setError(null)
              try {
                for (const [index, file] of files.entries()) {
                  const path = await uploadMedia(file, 'gallery')
                  const { error: insertError } = await supabase.from('gallery_items').insert({
                    storage_path: path,
                    published: true,
                    sort_order: items.length + index + 1,
                  })
                  if (insertError) throw insertError
                }
                await load()
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed')
              } finally {
                setBusy(false)
              }
            }}
          />
        </label>
      </div>
      <p className="text-xs text-[#8d8d8d]">Best size 1080×1080, a square. JPG, PNG, or WebP.</p>
      <Notice error={error} />
      {items.length === 0 && <div className="rounded-xl border border-dashed border-[#444] px-4 py-16 text-center text-sm text-[#9a9a9a]">No photos yet. Use Add photos.</div>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#161616]">
            <img src={publicMediaUrl(item.storage_path)} alt="" className="aspect-square w-full object-cover" />
            <div className="space-y-2 p-3">
              <input className="w-full rounded-lg border border-[#333] bg-[#111] px-2 py-1.5 text-sm" placeholder="Caption" defaultValue={item.caption ?? ''} onBlur={async (event) => { await supabase?.from('gallery_items').update({ caption: event.target.value }).eq('id', item.id) }} />
              <input className="w-full rounded-lg border border-[#333] bg-[#111] px-2 py-1.5 text-xs text-[#cfcfcf]" placeholder="Group, such as Ears" defaultValue={item.category ?? ''} onBlur={async (event) => { await supabase?.from('gallery_items').update({ category: event.target.value }).eq('id', item.id) }} />
              <button type="button" className="text-xs text-[#ffb089]" onClick={async () => { await supabase?.from('gallery_items').delete().eq('id', item.id); await load() }}>Remove</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export function AboutAdmin() {
  const [title, setTitle] = useState('About')
  const [body, setBody] = useState('')
  const [image, setImage] = useState('')
  const [video, setVideo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  useEffect(() => {
    void supabase?.from('content_sections').select('title, body, media_path, extra').eq('page', 'about').eq('section_key', 'main').maybeSingle().then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message)
      if (!data) return
      setTitle(data.title ?? 'About')
      setBody(data.body ?? '')
      setImage(data.media_path ?? '')
      const extra = data.extra as { video_path?: string } | null
      setVideo(extra?.video_path ?? '')
    })
  }, [])

  return (
    <form
      className="mx-auto max-w-6xl space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        const { error: saveError } = await supabase!.from('content_sections').upsert(
          { page: 'about', section_key: 'main', title, body, media_path: image || null, extra: { video_path: video || null }, visible: true, sort_order: 1 },
          { onConflict: 'page,section_key' },
        )
        if (saveError) setError(saveError.message)
        else setOk('About page saved.')
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">About</h1>
          <p className="mt-1 text-sm text-[#9a9a9a]">The story of the studio, plus one photo and an optional video.</p>
        </div>
        <PrimaryButton type="submit">Save about page</PrimaryButton>
      </div>
      <Notice error={error} ok={ok} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-4">
          <TextField label="Title" hint="Example: About Romell" value={title} onChange={(event) => setTitle(event.target.value)} />
          <TextArea label="The story" hint="Write it the way you would tell a new client." value={body} onChange={(event) => setBody(event.target.value)} />
        </Card>
        <div className="space-y-5">
          <Card>
            <MediaField label="Photo" hint="Tall photo, about 1200×1500." folder="about" accept="image/jpeg,image/png,image/webp" value={image} onChange={setImage} />
          </Card>
          <Card>
            <MediaField label="Video" hint="Optional. Wide MP4, about 1600×900." folder="about" accept="video/mp4" value={video} onChange={setVideo} />
          </Card>
        </div>
      </div>
    </form>
  )
}

export function ContactAdmin() {
  const [form, setForm] = useState({ title: 'Contact', body: '', phone: '', email: '', address: '', city: 'Taguig' })
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([
      supabase!.from('content_sections').select('title, body').eq('page', 'contact').eq('section_key', 'main').maybeSingle(),
      supabase!.from('site_settings').select('phone, email, address, city').eq('id', 1).maybeSingle(),
    ]).then(([section, settings]) => {
      if (section.error || settings.error) setError(section.error?.message || settings.error?.message || '')
      setForm({
        title: section.data?.title ?? 'Contact',
        body: section.data?.body ?? '',
        phone: settings.data?.phone ?? '',
        email: settings.data?.email ?? '',
        address: settings.data?.address ?? '',
        city: settings.data?.city ?? 'Taguig',
      })
    })
  }, [])

  return (
    <form
      className="mx-auto max-w-6xl space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        const [section, settings] = await Promise.all([
          supabase!.from('content_sections').upsert({ page: 'contact', section_key: 'main', title: form.title, body: form.body, visible: true, sort_order: 1 }, { onConflict: 'page,section_key' }),
          supabase!.from('site_settings').update({ phone: form.phone || null, email: form.email || null, address: form.address || null, city: form.city }).eq('id', 1),
        ])
        if (section.error || settings.error) setError(section.error?.message || settings.error?.message || '')
        else setOk('Contact details saved.')
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Contact</h1>
          <p className="mt-1 text-sm text-[#9a9a9a]">How a client reaches the studio. Facebook, Instagram, WhatsApp, and Viber are under Settings.</p>
        </div>
        <PrimaryButton type="submit">Save contact</PrimaryButton>
      </div>
      <Notice error={error} ok={ok} />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-base font-semibold">The page</h2>
          <TextField label="Title" hint="Example: Contact" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <TextArea label="Note for visitors" hint="A short line about how you reply." value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
        </Card>
        <Card className="space-y-4">
          <h2 className="text-base font-semibold">How to reach you</h2>
          <TextField label="Phone" hint="The number clients should call or text." value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <TextField label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <TextField label="Street address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          <TextField label="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        </Card>
      </div>
    </form>
  )
}

export function SettingsAdmin() {
  const [form, setForm] = useState({ facebook_url: '', instagram_url: '', whatsapp: '', viber: '', footer_text: '', seo_title: '', seo_description: '', logo_path: '' })
  const [affiliation, setAffiliation] = useState<AffiliationContent>(defaultAffiliation)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    void Promise.all([
      supabase.from('site_settings').select('facebook_url, instagram_url, whatsapp, viber, footer_text, seo_title, seo_description, logo_path').eq('id', 1).maybeSingle(),
      supabase.from('content_sections').select('subtitle, title, body, extra').eq('page', 'site').eq('section_key', 'affiliation').maybeSingle(),
    ]).then(([settings, section]) => {
      if (settings.error || section.error) setError(settings.error?.message || section.error?.message || '')
      if (settings.data) setForm({
        facebook_url: settings.data.facebook_url ?? '',
        instagram_url: settings.data.instagram_url ?? '',
        whatsapp: settings.data.whatsapp ?? '',
        viber: settings.data.viber ?? '',
        footer_text: settings.data.footer_text ?? '',
        seo_title: settings.data.seo_title ?? '',
        seo_description: settings.data.seo_description ?? '',
        logo_path: settings.data.logo_path ?? '',
      })
      if (section.data) setAffiliation(affiliationFromRow(section.data))
    })
  }, [])

  return (
    <form
      className="mx-auto max-w-6xl space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        setError(null)
        setOk(null)
        const [settings, section] = await Promise.all([
          supabase!.from('site_settings').update({
            facebook_url: form.facebook_url || null,
            instagram_url: form.instagram_url || null,
            whatsapp: form.whatsapp || null,
            viber: form.viber || null,
            footer_text: form.footer_text || null,
            seo_title: form.seo_title || null,
            seo_description: form.seo_description || null,
            logo_path: form.logo_path || null,
          }).eq('id', 1),
          supabase!.from('content_sections').upsert({
            page: 'site',
            section_key: 'affiliation',
            subtitle: affiliation.eyebrow,
            title: affiliation.title,
            body: affiliation.tagline,
            extra: { logos: affiliation.logos },
            visible: true,
            sort_order: 1,
          }, { onConflict: 'page,section_key' }),
        ])
        if (settings.error || section.error) setError(settings.error?.message || section.error?.message || '')
        else setOk('Settings saved.')
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
          <p className="mt-1 max-w-xl text-sm text-[#9a9a9a]">Social links, the footer, the Google text, the store logo, and the affiliation strip at the bottom of the site.</p>
        </div>
        <PrimaryButton type="submit">Save settings</PrimaryButton>
      </div>
      <nav className="flex flex-wrap gap-2">
        {[
          ['socials', '1. Socials'],
          ['footer', '2. Footer'],
          ['search', '3. Google'],
          ['logo', '4. Logo'],
          ['affiliation', '5. Affiliation'],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-[#333] bg-[#161616] px-3 py-1.5 text-sm hover:border-[#FF7900]">{label}</a>
        ))}
      </nav>
      <Notice error={error} ok={ok} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Card id="socials" className="scroll-mt-4 space-y-4">
            <div>
              <h2 className="text-base font-semibold">Where clients can message you</h2>
              <p className="mt-1 text-sm text-[#9a9a9a]">Paste the full link for Facebook and Instagram. For WhatsApp and Viber, type the number with the country code.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Facebook" hint="Example: https://facebook.com/yourpage" value={form.facebook_url} onChange={(event) => setForm({ ...form, facebook_url: event.target.value })} />
              <TextField label="Instagram" hint="Example: https://instagram.com/yourname" value={form.instagram_url} onChange={(event) => setForm({ ...form, instagram_url: event.target.value })} />
              <TextField label="WhatsApp" hint="Example: +63 9XX XXX XXXX" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} />
              <TextField label="Viber" hint="The same kind of number, or a Viber link." value={form.viber} onChange={(event) => setForm({ ...form, viber: event.target.value })} />
            </div>
          </Card>
          <Card id="footer" className="scroll-mt-4 space-y-4">
            <div>
              <h2 className="text-base font-semibold">Bottom of every page</h2>
              <p className="mt-1 text-sm text-[#9a9a9a]">A short line under the menu. Leave it blank if you do not want one yet.</p>
            </div>
            <TextArea label="Footer line" hint="Example: Professional piercing in Taguig." value={form.footer_text} onChange={(event) => setForm({ ...form, footer_text: event.target.value })} />
          </Card>
          <Card id="search" className="scroll-mt-4 space-y-4">
            <div>
              <h2 className="text-base font-semibold">What Google shows</h2>
              <p className="mt-1 text-sm text-[#9a9a9a]">This is the title and the short paragraph in search results and in the browser tab.</p>
            </div>
            <TextField label="Page name" hint="Example: Romell Body Piercing" value={form.seo_title} onChange={(event) => setForm({ ...form, seo_title: event.target.value })} />
            <TextArea label="Short description" hint="One or two sentences about the studio." value={form.seo_description} onChange={(event) => setForm({ ...form, seo_description: event.target.value })} />
          </Card>
        </div>
        <Card id="logo" className="scroll-mt-4 space-y-3 lg:sticky lg:top-4">
          <div>
            <h2 className="text-base font-semibold">Store logo</h2>
            <p className="mt-1 text-sm text-[#9a9a9a]">A square picture, at least 512×512. PNG with a clear background looks best.</p>
          </div>
          <MediaField label="Logo file" hint="PNG, WebP, or JPG." folder="branding" accept="image/png,image/webp,image/jpeg" value={form.logo_path} onChange={(path) => setForm({ ...form, logo_path: path })} />
        </Card>
      </div>
      <Card id="affiliation" className="scroll-mt-4 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Affiliation strip</h2>
            <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">The orange label, the organization name, the line under it, and the badges that scroll across the bottom of the site.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <TextField label="Small orange line" hint="Shown in capital letters." value={affiliation.eyebrow} onChange={(event) => setAffiliation({ ...affiliation, eyebrow: event.target.value })} />
          <TextField label="Main name" hint="The large white line." value={affiliation.title} onChange={(event) => setAffiliation({ ...affiliation, title: event.target.value })} />
          <TextField label="Line under the name" value={affiliation.tagline} onChange={(event) => setAffiliation({ ...affiliation, tagline: event.target.value })} />
        </div>
        <div>
          <p className="text-sm font-medium">Badges</p>
          <p className="mt-1 text-xs text-[#8d8d8d]">PNG with a clear background looks best. The order here is the order they scroll in.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {affiliation.logos.map((logo, index) => (
            <article key={`${logo.path}-${index}`} className="rounded-xl border border-[#2a2a2a] bg-[#101010] p-3">
              <div className="flex h-24 items-center justify-center rounded-lg bg-black">
                <img src={publicMediaUrl(logo.path)} alt="" className="max-h-20 max-w-full object-contain" />
              </div>
              <input
                className="mt-2 w-full rounded-lg border border-[#333] bg-[#111] px-2 py-1.5 text-xs"
                placeholder="Name of this badge"
                value={logo.alt}
                onChange={(event) => {
                  const logos = affiliation.logos.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item)
                  setAffiliation({ ...affiliation, logos })
                }}
              />
              <div className="mt-2 flex gap-3 text-xs">
                <button type="button" className="text-[#ffb067] disabled:opacity-30" disabled={index === 0} onClick={() => setAffiliation({ ...affiliation, logos: moveItem(affiliation.logos, index, -1) })}>Left</button>
                <button type="button" className="text-[#ffb067] disabled:opacity-30" disabled={index === affiliation.logos.length - 1} onClick={() => setAffiliation({ ...affiliation, logos: moveItem(affiliation.logos, index, 1) })}>Right</button>
                <button type="button" className="text-[#ffb089]" onClick={() => setAffiliation({ ...affiliation, logos: affiliation.logos.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button>
              </div>
            </article>
          ))}
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#444] px-3 text-center text-sm text-[#cfcfcf] hover:border-[#FF7900]">
            Add a badge
            <span className="mt-1 text-xs text-[#8d8d8d]">PNG, WebP, or JPG</span>
            <input
              className="hidden"
              type="file"
              accept="image/png,image/webp,image/jpeg"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                setError(null)
                try {
                  const path = await uploadMedia(file, 'affiliation')
                  const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
                  setAffiliation((current) => ({ ...current, logos: [...current.logos, { path, alt }] }))
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Upload failed')
                }
              }}
            />
          </label>
        </div>
      </Card>
    </form>
  )
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item!)
  return next
}
