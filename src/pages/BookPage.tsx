import { useState } from 'react'
import { Link } from 'react-router-dom'
import { OrangeButton } from '../components/ui/Buttons.tsx'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { LoadingScreen } from '../components/ui/LoadingScreen.tsx'
import { friendlyError } from '../lib/friendlyError.ts'
import { rbpField, rbpPanel } from '../components/ui/panels.ts'
import { supabase, supabaseConfigured } from '../lib/supabase.ts'

const inputClass = `${rbpField} h-11 [color-scheme:dark]`

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
          <p className="font-secondary text-[12px] font-semibold uppercase tracking-[0.28em] text-rbp-cream">Piercing Appointment</p>
          <GothicHeading as="h1" className="mt-3 text-[3rem] leading-[0.9]">
            Request Received
          </GothicHeading>
          <p className="font-secondary mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/80">
            The studio has your request and will contact you to confirm the appointment, aftercare guidance, and studio policies.
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
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-secondary text-[12px] font-semibold uppercase tracking-[0.32em] text-rbp-cream">Piercing Appointment</p>
        <GothicHeading as="h1" className="mt-3 text-[3.6rem] leading-[0.85] sm:text-[4.6rem]">
          Book a Piercing
        </GothicHeading>
        <p className="font-secondary mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/80">
          Request an appointment for professional piercing services. This is not jewelry checkout — for jewelry
          purchases, visit <Link to="/collections" className="text-rbp-accent">Collections</Link>.
        </p>
        <div className="mx-auto mt-6 h-[3px] w-48 bg-gradient-to-r from-transparent via-rbp-accent to-transparent" />
      </div>

      <form onSubmit={submit} className={`mx-auto mt-10 w-full max-w-3xl p-6 sm:p-8 ${rbpPanel}`}>
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
