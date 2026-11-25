import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { OrangeButton } from '../../components/ui/Buttons.tsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { destinationForRole, useAuth } from '../../features/auth/AuthProvider.tsx'
import { saveWholesalerApplicationDraft } from '../../features/wholesaler/applicationDraft.ts'
import { submitWholesalerApplication } from '../../features/wholesaler/submitApplication.ts'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { rbpPanel } from '../../components/ui/panels.ts'
import { AuthError, AuthLink, authField } from '../auth/AuthShell.tsx'
import { ResellerProgramInfo } from './ResellerProgramInfo.tsx'

export function ResellerRegisterPage() {
  const { configured, signUp, user, profile, reseller, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [barangay, setBarangay] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loggedInReseller = user && profile?.role === 'reseller'

  useEffect(() => {
    if (profile) {
      setFullName((prev) => prev || profile.full_name || '')
      setPhone((prev) => prev || profile.phone || '')
      setEmail((prev) => prev || profile.email || user?.email || '')
    }
    if (reseller) {
      setProvince(reseller.province)
      setCity(reseller.city)
      setBarangay(reseller.barangay)
      setPostalCode(reseller.postal_code)
      setAddress(reseller.address_line)
    }
  }, [profile, reseller, user?.email])

  if (loggedInReseller && reseller) {
    return <Navigate to={destinationForRole('reseller', reseller.status)} replace />
  }

  const completeApplication = async () => {
    if (!user) {
      setError('Sign in to submit your wholesaler application.')
      return false
    }
    const result = await submitWholesalerApplication({ province, city, barangay, postalCode, address, phone })
    if (result.error) {
      setError(result.error)
      return false
    }
    await refreshProfile()
    return true
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!province.trim() || !city.trim() || !barangay.trim() || !postalCode.trim() || !address.trim()) {
      setError('Complete your business / shipping address.')
      return
    }
    if (!phone.trim()) {
      setError('Phone number is required.')
      return
    }

    setSubmitting(true)

    if (user && profile && profile.role !== 'reseller') {
      const ok = await completeApplication()
      setSubmitting(false)
      if (ok) navigate('/wholesaler/pending', { replace: true })
      return
    }

    if (user && profile?.role === 'reseller' && !reseller) {
      const ok = await completeApplication()
      setSubmitting(false)
      if (ok) navigate('/wholesaler/pending', { replace: true })
      return
    }

    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email are required.')
      setSubmitting(false)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      setSubmitting(false)
      return
    }
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.')
      setSubmitting(false)
      return
    }
    if (password !== confirm) {
      setError('Passwords must match.')
      setSubmitting(false)
      return
    }

    const signup = await signUp({ fullName, email, password, phone }, { wholesalerApplication: true })
    if (signup.error) {
      setError(signup.error)
      setSubmitting(false)
      return
    }
    if (signup.needsVerification) {
      saveWholesalerApplicationDraft({
        email: email.trim(),
        province,
        city,
        barangay,
        postalCode,
        address,
        phone,
      })
      setSubmitting(false)
      setSent(true)
      return
    }
    const ok = await completeApplication()
    setSubmitting(false)
    if (ok) navigate(destinationForRole('reseller', 'pending'), { replace: true })
  }

  if (submitting) return <LoadingScreen label="Submitting application" full />

  if (sent) {
    return (
      <div className="w-full bg-black px-5 py-16">
        <div className={`mx-auto max-w-lg ${rbpPanel} px-8 py-10 text-center`}>
          <GothicHeading as="h1" className="text-[2.4rem] leading-[0.9]">
            Check your email
          </GothicHeading>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Verify <span className="text-rbp-accent">{email.trim()}</span>, then sign in. If the studio has not
            received your application yet, return here and submit your business address while signed in.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            <AuthLink to="/login">Sign in</AuthLink>
            <AuthLink to="/wholesaler/register">Wholesaler information</AuthLink>
          </div>
        </div>
      </div>
    )
  }

  const existingAccount = Boolean(user && profile)

  return (
    <div className="w-full bg-black">
      <section className="border-b border-rbp-border bg-black px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rbp-cream">Romell Body Piercing</p>
          <GothicHeading as="h1" className="mt-2 text-[2.8rem] leading-none text-rbp-accent lg:text-[3.4rem]">
            Become a wholesaler
          </GothicHeading>
          <p className="mt-3 max-w-2xl text-sm text-white/75">
            Partner with the studio, share a checkout code with your clients, and track attributed sales in your own
            portal.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:px-8 lg:py-14">
        <ResellerProgramInfo />

        <aside className={`h-fit lg:sticky lg:top-24 ${rbpPanel} p-6`}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Application</h2>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            Already a wholesaler?{' '}
            <AuthLink to="/login">Sign in</AuthLink> to open your portal. Shopping only?{' '}
            <Link to="/register" className="text-rbp-accent">
              Customer account
            </Link>
            .
          </p>
          {!configured && <p className="mt-4 text-sm text-rbp-cream">Registration is not available right now.</p>}
          <AuthError message={error} />
          <form className="mt-4 space-y-4" onSubmit={submit}>
        {!existingAccount && (
          <>
            <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
              Full name
              <input className={`${authField} mt-2`} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
              Email
              <input className={`${authField} mt-2`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
              Phone number
              <input className={`${authField} mt-2`} type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
              Password
              <input className={`${authField} mt-2`} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
              Confirm password
              <input className={`${authField} mt-2`} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
          </>
        )}
        {existingAccount && (
          <p className="text-sm text-white/80">
            Signed in as <span className="text-rbp-accent">{profile?.email}</span>. Submit your wholesaler address below.
          </p>
        )}
        <p className="text-xs uppercase tracking-[0.16em] text-rbp-cream">Business address</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-rbp-cream sm:col-span-1">
            Province
            <input className={`${authField} mt-1`} value={province} onChange={(e) => setProvince(e.target.value)} />
          </label>
          <label className="block text-xs text-rbp-cream sm:col-span-1">
            City / municipality
            <input className={`${authField} mt-1`} value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label className="block text-xs text-rbp-cream sm:col-span-1">
            Barangay
            <input className={`${authField} mt-1`} value={barangay} onChange={(e) => setBarangay(e.target.value)} />
          </label>
          <label className="block text-xs text-rbp-cream sm:col-span-1">
            Postal code
            <input className={`${authField} mt-1`} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </label>
        </div>
        <label className="block text-xs text-rbp-cream">
          Street / complete address
          <textarea className={`${authField} mt-1`} rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        {existingAccount && (
          <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
            Contact phone
            <input className={`${authField} mt-2`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        )}
            <OrangeButton type="submit" disabled={submitting || !configured} className="h-11 w-full">
              {submitting ? 'Submitting' : 'Submit application'}
            </OrangeButton>
          </form>
        </aside>
      </section>
    </div>
  )
}