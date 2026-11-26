import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { OrangeButton } from '../components/ui/Buttons.tsx'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { LoadingScreen } from '../components/ui/LoadingScreen.tsx'
import { friendlyError } from '../lib/friendlyError.ts'
import { asset } from '../lib/assets.ts'
import {
  BOOK_PAGE_DEFAULT_PRICE_LIST,
  BOOK_PAGE_DEFAULT_STUDIO,
  bookPageImagePath,
} from '../lib/bookPageMedia.ts'
import { publicMediaUrl } from '../lib/media.ts'
import { rbpField, rbpPanel } from '../components/ui/panels.ts'
import { supabase, supabaseConfigured } from '../lib/supabase.ts'

const inputClass = `${rbpField} h-11 [color-scheme:dark]`

const BOOK_SIDEBAR_LOGO = asset('branding/rbp-association-hero-logo.png')

export function BookPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredDate: '',
    piercingType: '',
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [priceListPath, setPriceListPath] = useState(BOOK_PAGE_DEFAULT_PRICE_LIST)
  const [studioPhotoPath, setStudioPhotoPath] = useState(BOOK_PAGE_DEFAULT_STUDIO)

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return
    let active = true
    void supabase
      .from('content_sections')
      .select('section_key, media_path')
      .eq('page', 'book')
      .in('section_key', ['price_list', 'studio_photo'])
      .then(({ data }) => {
        if (!active || !data) return
        for (const row of data as { section_key: string; media_path: string | null }[]) {
          if (row.section_key === 'price_list') {
            setPriceListPath(bookPageImagePath(row.media_path, BOOK_PAGE_DEFAULT_PRICE_LIST))
          }
          if (row.section_key === 'studio_photo') {
            setStudioPhotoPath(bookPageImagePath(row.media_path, BOOK_PAGE_DEFAULT_STUDIO))
          }
        }
      })
    return () => {
      active = false
    }
  }, [])

  const priceListSrc = publicMediaUrl(priceListPath) || asset(BOOK_PAGE_DEFAULT_PRICE_LIST)
  const studioPhotoSrc = publicMediaUrl(studioPhotoPath) || asset(BOOK_PAGE_DEFAULT_STUDIO)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.fullName || !form.email || !form.phone) {
      setError('Name, email, and phone are required.')
      return
    }
    if (!supabaseConfigured || !supabase) {
      setError('Booking is not available right now. Please contact the studio.')
      return
    }
    setSubmitting(true)
    try {
      const details = [
        'Piercing appointment request',
        `Name: ${form.fullName.trim()}`,
        form.preferredDate ? `Preferred date: ${form.preferredDate}` : '',
        form.piercingType.trim() ? `Placement: ${form.piercingType.trim()}` : '',
        form.notes.trim() ? `Notes: ${form.notes.trim()}` : '',
      ].filter(Boolean).join('\n')
      const { error: dbError } = await supabase.from('inquiries').insert({
        question: details,
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: 'open',
        source: 'appointment',
      })
      if (dbError) throw dbError
      setSubmitted(true)
    } catch (err) {
      setError(friendlyError(err, 'The booking could not be sent. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex w-full justify-center bg-black px-5 py-20">
        <div className={`w-full max-w-xl px-8 py-12 text-center ${rbpPanel}`}>
          <p className="font-secondary text-[12px] font-semibold uppercase tracking-[0.28em] text-rbp-cream">
            Piercing Appointment
          </p>
          <GothicHeading as="h1" className="mt-3 text-[3rem] leading-[0.9]">
            Request Received
          </GothicHeading>
          <p className="font-secondary mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/80">
            The studio has your request and will contact you to confirm the appointment, aftercare guidance, and
            studio policies.
          </p>
          <Link to="/" className="mt-8 inline-block text-[14px] font-semibold text-rbp-accent">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-black px-5 py-14 sm:px-8 lg:py-20">
      {submitting ? <LoadingScreen label="Sending your request" full /> : null}

      <div className="mx-auto grid w-full max-w-[1920px] grid-cols-1 gap-10 lg:grid-cols-[auto_minmax(0,48rem)_1fr] lg:items-stretch lg:gap-x-6 xl:gap-x-12 2xl:gap-x-16">
        <aside className="order-2 flex w-full max-w-[520px] shrink-0 justify-center lg:order-1 lg:mx-0 lg:w-auto lg:max-w-none lg:justify-end lg:justify-self-start lg:self-stretch">
          <img
            src={priceListSrc}
            alt="Body piercing price list — safe, sterile, professional"
            className="h-auto w-full object-contain lg:h-[min(1280px,calc(100dvh-5.25rem))] lg:w-auto lg:max-w-[min(74vw,920px)] lg:object-right xl:h-[min(1320px,calc(100dvh-5rem))] xl:max-w-[min(76vw,960px)]"
            width={640}
            height={900}
            loading="lazy"
            decoding="async"
          />
        </aside>

        <div className="order-1 flex w-full max-w-3xl flex-col justify-self-center lg:order-2 lg:max-w-none lg:justify-self-center lg:self-stretch">
          <div className="text-center">
            <p className="font-secondary text-[12px] font-semibold uppercase tracking-[0.32em] text-rbp-cream">
              Piercing Appointment
            </p>
            <GothicHeading
              as="h1"
              className="mt-3 text-[3.6rem] leading-[0.85] text-rbp-accent sm:text-[4.6rem]"
            >
              Book a Piercing
            </GothicHeading>
            <p className="font-secondary mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/80">
              Request an appointment for professional piercing services. This is not jewelry checkout — for jewelry
              purchases, visit <Link to="/collections" className="text-rbp-accent">Collections</Link>.
            </p>
            <div className="mx-auto mt-6 h-[3px] w-48 bg-gradient-to-r from-transparent via-rbp-accent to-transparent" />
          </div>

          <form onSubmit={submit} className={`mt-10 w-full p-6 sm:p-8 ${rbpPanel}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name *">
                <input
                  required
                  className={inputClass}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </Field>
              <Field label="Email *">
                <input
                  required
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Phone *">
                <input
                  required
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Preferred date">
                <input
                  type="date"
                  className={inputClass}
                  value={form.preferredDate}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Piercing type / placement">
                <input
                  className={inputClass}
                  placeholder="e.g. earlobe, nostril, navel"
                  value={form.piercingType}
                  onChange={(e) => setForm({ ...form, piercingType: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Notes">
                <textarea
                  className={`${rbpField} min-h-[120px] [color-scheme:dark]`}
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
            </div>
            {error && <p className="mt-4 text-center text-sm text-red-400">{friendlyError(error)}</p>}
            <div className="mt-6 flex justify-center">
              <OrangeButton type="submit" disabled={submitting} className="h-11 min-w-[240px] font-semibold">
                {submitting ? 'Submitting…' : 'Submit Booking Request'}
              </OrangeButton>
            </div>
          </form>
        </div>

        <aside className="order-3 mx-auto flex w-full max-w-[360px] min-h-0 flex-col items-center gap-5 lg:mx-0 lg:max-w-none lg:justify-self-end lg:self-stretch lg:gap-6">
          <img
            src={BOOK_SIDEBAR_LOGO}
            alt="Romell Body Piercing"
            className="h-auto w-full max-w-[300px] shrink-0 object-contain xl:max-w-[340px]"
            width={340}
            height={340}
            loading="lazy"
            decoding="async"
          />
          <img
            src={studioPhotoSrc}
            alt="Romell Body Piercing studio interior"
            className="w-full min-h-[200px] flex-1 rounded-rbp border border-rbp-border object-cover shadow-[0_0_28px_rgba(255,122,0,0.1)] lg:min-h-0"
            width={400}
            height={520}
            loading="lazy"
            decoding="async"
          />
        </aside>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-left text-[13px] text-white/75">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  )
}