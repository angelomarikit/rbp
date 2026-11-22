import { useState } from 'react'
import { OrangeButton } from '../../components/ui/Buttons.tsx'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { rbpField } from '../../components/ui/panels.ts'
import { useAuth } from '../../features/auth/AuthProvider.tsx'

export function AccountProfilePage() {
  const { profile, updateProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    if (!fullName.trim() || !phone.trim()) {
      setError('Full name and phone number are required.')
      return
    }
    setSaving(true)
    const result = await updateProfile({ fullName, phone })
    setSaving(false)
    if (result.error) setError(result.error)
    else setMessage('Profile saved.')
  }

  return (
    <div className="max-w-lg">
      <GothicHeading as="h1" className="text-[3rem] leading-[0.9]">
        Profile
      </GothicHeading>
      <p className="mt-3 text-sm text-white/75">Email changes stay on the settings page so the confirmation message can arrive first.</p>
      <form className="mt-8 space-y-4" onSubmit={save}>
        {error && <p className="text-sm text-[#ffb089]">{error}</p>}
        {message && <p className="text-sm text-rbp-accent">{message}</p>}
        <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
          Full name
          <input className={`${rbpField} mt-2 h-11`} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
          Phone number
          <input className={`${rbpField} mt-2 h-11`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <p className="text-sm text-white/70">Email: {profile?.email}</p>
        <OrangeButton type="submit" disabled={saving}>
          {saving ? 'Saving' : 'Save Profile'}
        </OrangeButton>
      </form>
    </div>
  )
}
