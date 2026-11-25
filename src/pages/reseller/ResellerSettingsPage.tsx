import { useEffect, useState } from 'react'
import { OrangeButton } from '../../components/ui/Buttons.tsx'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { SuccessModal } from '../../components/ui/SuccessModal.tsx'
import { RESELLER_SELECT } from '../../features/reseller/types.ts'
import { useAuth } from '../../features/auth/AuthProvider.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { rbpField } from '../../components/ui/panels.ts'
import { supabase } from '../../lib/supabase.ts'

export function ResellerSettingsPage() {
  const { profile, reseller, refreshProfile, updateEmail, updatePassword, updateProfile } = useAuth()
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [barangay, setBarangay] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (reseller) {
      setProvince(reseller.province)
      setCity(reseller.city)
      setBarangay(reseller.barangay)
      setPostalCode(reseller.postal_code)
      setAddress(reseller.address_line)
    }
    if (profile) {
      setPhone(profile.phone ?? '')
      setFullName(profile.full_name ?? '')
      setEmail(profile.email ?? '')
    }
  }, [reseller, profile])

  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase || !reseller) return
    setError(null)
    setNotice(null)
    setSaving(true)
    const { error: resellerError } = await supabase
      .from('resellers')
      .update({
        province: province.trim(),
        city: city.trim(),
        barangay: barangay.trim(),
        postal_code: postalCode.trim(),
        address_line: address.trim(),
      })
      .eq('id', reseller.id)
      .select(RESELLER_SELECT)
      .single()
    const profileResult = await updateProfile({ fullName: fullName.trim(), phone: phone.trim() })
    setSaving(false)
    if (resellerError) setError(friendlyError(resellerError, 'Address could not be saved.'))
    else if (profileResult.error) setError(profileResult.error)
    else {
      setNotice('Profile and address updated.')
      await refreshProfile()
    }
  }

  const saveEmail = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    const result = await updateEmail(email)
    if (result.error) setError(result.error)
    else setNotice('Check your email to confirm the new address.')
  }

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords must match.')
      return
    }
    const result = await updatePassword(password)
    if (result.error) setError(result.error)
    else {
      setPassword('')
      setConfirm('')
      setNotice('Password updated.')
    }
  }

  if (saving) return <LoadingScreen label="Saving" full />

  return (
    <div className="max-w-lg">
      <GothicHeading as="h1" className="text-[3rem] leading-[0.9]">
        Settings
      </GothicHeading>
      {error && <p className="mt-4 text-sm text-[#ffb089]">{friendlyError(error)}</p>}
      {notice ? <SuccessModal message={notice} onClose={() => setNotice(null)} /> : null}
      <form className="mt-8 space-y-4" onSubmit={saveAddress}>
        <h2 className="text-sm uppercase tracking-[0.18em] text-rbp-cream">Contact & address</h2>
        <input className={`${rbpField} h-11`} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className={`${rbpField} h-11`} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={rbpField} placeholder="Province" value={province} onChange={(e) => setProvince(e.target.value)} />
          <input className={rbpField} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <input className={rbpField} placeholder="Barangay" value={barangay} onChange={(e) => setBarangay(e.target.value)} />
          <input className={rbpField} placeholder="Postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        </div>
        <textarea className={rbpField} rows={2} placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <OrangeButton type="submit">Save address</OrangeButton>
      </form>
      <form className="mt-10 space-y-4" onSubmit={saveEmail}>
        <h2 className="text-sm uppercase tracking-[0.18em] text-rbp-cream">Email</h2>
        <input className={`${rbpField} h-11`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <OrangeButton type="submit">Update email</OrangeButton>
      </form>
      <form className="mt-10 space-y-4" onSubmit={savePassword}>
        <h2 className="text-sm uppercase tracking-[0.18em] text-rbp-cream">Password</h2>
        <input className={`${rbpField} h-11`} type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className={`${rbpField} h-11`} type="password" autoComplete="new-password" placeholder="Confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <OrangeButton type="submit">Update password</OrangeButton>
      </form>
    </div>
  )
}