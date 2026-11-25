import { useEffect, useState } from 'react'
import { useSiteLogo } from '../../features/site/SiteBrandingProvider.tsx'
import { affiliationFromRow, defaultAffiliation, type AffiliationContent } from '../../lib/affiliation.ts'
import { isCustomStoreLogo, storeLogoSrc } from '../../lib/storeLogo.ts'
import { applySiteFont, fontFromZip, siteFontFromExtra, type SiteFontSet } from '../../lib/siteFont.ts'
import { friendlyError } from '../../lib/friendlyError.ts'
import { emptyPaymentQrs, paymentQrsFromExtra, type PaymentQrs } from '../../lib/paymentQr.ts'
import { supabase } from '../../lib/supabase.ts'
import { publicMediaUrl, uploadMedia } from '../../lib/media.ts'
import { Card, MediaField, Notice, PrimaryButton, TextArea, TextField } from './ui.tsx'

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
        setError(null)
        setOk(null)
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
        setError(null)
        setOk(null)
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
  const { refreshLogo } = useSiteLogo()
  const [form, setForm] = useState({ facebook_url: '', instagram_url: '', whatsapp: '', viber: '', footer_text: '', seo_title: '', seo_description: '', logo_path: '' })
  const [affiliation, setAffiliation] = useState<AffiliationContent>(defaultAffiliation)
  const [paymentQrs, setPaymentQrs] = useState<PaymentQrs>(emptyPaymentQrs)
  const [font, setFont] = useState<SiteFontSet | null>(null)
  const [fontBusy, setFontBusy] = useState<'primary' | 'secondary' | null>(null)
  const [fontError, setFontError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    void Promise.all([
      supabase.from('site_settings').select('facebook_url, instagram_url, whatsapp, viber, footer_text, seo_title, seo_description, logo_path').eq('id', 1).maybeSingle(),
      supabase.from('content_sections').select('subtitle, title, body, extra').eq('page', 'site').eq('section_key', 'affiliation').maybeSingle(),
      supabase.from('content_sections').select('extra').eq('page', 'site').eq('section_key', 'payment').maybeSingle(),
      supabase.from('content_sections').select('title, extra').eq('page', 'site').eq('section_key', 'font').maybeSingle(),
    ]).then(([settings, section, payment, savedFont]) => {
      if (settings.error || section.error || payment.error || savedFont.error) setError(settings.error?.message || section.error?.message || payment.error?.message || savedFont.error?.message || '')
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
      if (payment.data) setPaymentQrs(paymentQrsFromExtra(payment.data.extra))
      if (savedFont.data) setFont(siteFontFromExtra(savedFont.data.title, savedFont.data.extra))
    })
  }, [])

  const persistFont = async (next: SiteFontSet | null) => {
    if (!supabase) return
    if (!next?.primary && !next?.secondary) {
      const { error: deleteError } = await supabase.from('content_sections').delete().eq('page', 'site').eq('section_key', 'font')
      if (deleteError) throw deleteError
      setFont(null)
      applySiteFont(null)
      return
    }
    const title = [next.primary?.family, next.secondary?.family].filter(Boolean).join(' / ')
    const { error: saveError } = await supabase.from('content_sections').upsert({
      page: 'site',
      section_key: 'font',
      title,
      extra: {
        primary: next.primary ? { family: next.primary.family, files: next.primary.files } : null,
        secondary: next.secondary ? { family: next.secondary.family, files: next.secondary.files } : null,
      },
      visible: true,
      sort_order: 3,
    }, { onConflict: 'page,section_key' })
    if (saveError) throw saveError
    setFont(next)
    applySiteFont(next)
  }

  const saveSiteFont = async (role: 'primary' | 'secondary', file: File) => {
    setFontBusy(role)
    setFontError(null)
    setError(null)
    setOk(null)
    try {
      const nextFont = await fontFromZip(file)
      const next: SiteFontSet = {
        primary: role === 'primary' ? nextFont : font?.primary ?? null,
        secondary: role === 'secondary' ? nextFont : font?.secondary ?? null,
      }
      await persistFont(next)
      setOk(role === 'primary'
        ? `${nextFont.family} is now the title font.`
        : `${nextFont.family} is now the font for subtitles and descriptions.`)
    } catch (err) {
      const message = fontUploadError(err)
      setFontError(message)
      setError(message)
    } finally {
      setFontBusy(null)
    }
  }

  const clearSiteFont = async (role: 'primary' | 'secondary') => {
    setError(null)
    setOk(null)
    try {
      const next: SiteFontSet = {
        primary: role === 'primary' ? null : font?.primary ?? null,
        secondary: role === 'secondary' ? null : font?.secondary ?? null,
      }
      await persistFont(next.primary || next.secondary ? next : null)
      setOk(role === 'primary' ? 'Titles are back on the original font.' : 'Subtitles and descriptions are back on the original font.')
    } catch (err) {
      setError(friendlyError(err, 'The original font could not be restored.'))
    }
  }

  return (
    <form
      className="mx-auto max-w-6xl space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        setError(null)
        setOk(null)
        const [settings, section, payment] = await Promise.all([
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
          supabase!.from('content_sections').upsert({
            page: 'site',
            section_key: 'payment',
            title: 'Payment QR',
            extra: { gcash_qr: paymentQrs.gcash || null, bpi_qr: paymentQrs.bpi || null },
            visible: true,
            sort_order: 2,
          }, { onConflict: 'page,section_key' }),
        ])
        if (settings.error || section.error || payment.error) setError(settings.error?.message || section.error?.message || payment.error?.message || '')
        else {
          setOk('Settings saved.')
          await refreshLogo()
        }
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
          <p className="mt-1 max-w-xl text-sm text-[#9a9a9a]">Social links, the footer, the Google text, the store logo, the affiliation strip, the GCash and BPI QR codes, and the website font.</p>
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
          ['payment', '6. Payment'],
          ['font', '7. Font'],
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
              <p className="mt-1 text-sm text-[#9a9a9a]">This is the title and the short paragraph in search results and in the browser tab. Saving writes them to the database, and the public site uses them. Admin, account, checkout, and sign-in pages stay hidden from Google.</p>
            </div>
            <TextField label="Page name" hint="Example: Romell Body Piercing" value={form.seo_title} onChange={(event) => setForm({ ...form, seo_title: event.target.value })} />
            <TextArea label="Short description" hint="One or two sentences about the studio." value={form.seo_description} onChange={(event) => setForm({ ...form, seo_description: event.target.value })} />
          </Card>
        </div>
        <Card id="logo" className="scroll-mt-4 space-y-3 lg:sticky lg:top-4">
          <div>
            <h2 className="text-base font-semibold">Store logo</h2>
            <p className="mt-1 text-sm text-[#9a9a9a]">A square picture, at least 512×512. PNG with a clear background looks best.</p>
            <p className="mt-1 text-xs text-[#8d8d8d]">Same image as the site header.</p>
          </div>
          <MediaField
            label="Logo file"
            hint="PNG, WebP, or JPG."
            folder="branding"
            accept="image/png,image/webp,image/jpeg"
            value={form.logo_path}
            previewSrc={storeLogoSrc(form.logo_path)}
            onChange={(path) => setForm({ ...form, logo_path: path })}
            previewClassName="mt-3 mx-auto aspect-square w-full max-w-[220px] rounded-xl border border-[#333] bg-black object-contain p-4"
          />
          {form.logo_path && !isCustomStoreLogo(form.logo_path) ? (
            <p className="text-xs text-[#ffb089]">
              The saved file is not used in the header until you upload a logo here, or clear the old path.
            </p>
          ) : null}
          {form.logo_path ? (
            <button
              type="button"
              className="text-sm text-[#ffb089]"
              onClick={() => setForm({ ...form, logo_path: '' })}
            >
              Use default Romell logo
            </button>
          ) : null}
        </Card>
      </div>
      <Card id="affiliation" className="scroll-mt-4 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Affiliation strip</h2>
            <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">
              Footer affiliation strip and organization badges. Photos, member shots, and videos for the Association page
              are under Online store → Association.
            </p>
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
      <Card id="font" className="scroll-mt-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Website font</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">Add a zip or a font file for titles, and another for subtitles and descriptions. A shadow or outline file in the zip is skipped when a solid font is in there too.</p>
        </div>
        {fontError ? <p className="text-sm text-[#ffb089]">{fontError}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#101010] p-4">
            <p className="text-sm text-white">First font: {font?.primary?.family ?? 'The original font'}</p>
            <p className="mt-1 text-xs text-[#8d8d8d]">Titles only.</p>
            <p className="mt-3 text-3xl leading-tight text-[#ffb067]" style={{ fontFamily: 'var(--rbp-font-display)' }}>Romell Body Piercing</p>
            <input
              className="mt-4 block w-full text-sm text-[#cfcfcf] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#FF7900] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
              type="file"
              accept=".zip,.ttf,.otf,.woff,.woff2,application/zip,application/x-zip-compressed,font/ttf,font/otf"
              disabled={fontBusy !== null}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void saveSiteFont('primary', file)
              }}
            />
            {font?.primary ? (
              <button type="button" className="mt-3 block text-sm text-[#ffb089]" onClick={() => void clearSiteFont('primary')}>
                Use the original title font
              </button>
            ) : null}
          </div>
          <div className="rounded-xl border border-[#2a2a2a] bg-[#101010] p-4">
            <p className="text-sm text-white">Secondary font: {font?.secondary?.family ?? 'The original font'}</p>
            <p className="mt-1 text-xs text-[#8d8d8d]">Subtitles and descriptions. Not titles.</p>
            <p className="font-secondary mt-3 text-base leading-relaxed text-[#f3f3f3]">Expert piercing services and premium body jewelry.</p>
            <input
              className="mt-4 block w-full text-sm text-[#cfcfcf] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#FF7900] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
              type="file"
              accept=".zip,.ttf,.otf,.woff,.woff2,application/zip,application/x-zip-compressed,font/ttf,font/otf"
              disabled={fontBusy !== null}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void saveSiteFont('secondary', file)
              }}
            />
            {font?.secondary ? (
              <button type="button" className="mt-3 block text-sm text-[#ffb089]" onClick={() => void clearSiteFont('secondary')}>
                Use the original text font
              </button>
            ) : null}
          </div>
        </div>
        {fontBusy ? <p className="text-sm text-[#ffb067]">{fontBusy === 'primary' ? 'Adding the title font…' : 'Adding the secondary font…'}</p> : null}
      </Card>
      <Card id="payment" className="scroll-mt-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Payment QR codes</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">Upload the GCash QR and the BPI QR. Checkout shows these two choices, and the customer sees the QR for the one they pick.</p>
        </div>
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <MediaField fileFirst label="GCash QR" hint="A square picture of the GCash QR. PNG or JPG." folder="payments" accept="image/png,image/jpeg,image/webp" value={paymentQrs.gcash} onChange={(path) => setPaymentQrs({ ...paymentQrs, gcash: path })} previewClassName="mt-3 aspect-square w-full max-w-[240px] rounded-xl bg-white object-contain p-3" />
          <MediaField fileFirst label="BPI QR" hint="A square picture of the BPI QR. PNG or JPG." folder="payments" accept="image/png,image/jpeg,image/webp" value={paymentQrs.bpi} onChange={(path) => setPaymentQrs({ ...paymentQrs, bpi: path })} previewClassName="mt-3 aspect-square w-full max-w-[240px] rounded-xl bg-white object-contain p-3" />
        </div>
      </Card>
    </form>
  )
}

function fontUploadError(err: unknown) {
  const message = err instanceof Error ? err.message : ''
  if (/zip|ttf|otf|woff|font/i.test(message) && message.length < 180 && !/[{}[\]]/.test(message)) return message
  if (/payload|too large|413/i.test(message)) return 'That font is too large to save. Use a smaller TTF, OTF, or WOFF file.'
  return friendlyError(err, 'That font could not be added. Use a zip, TTF, OTF, or WOFF file.')
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item!)
  return next
}
