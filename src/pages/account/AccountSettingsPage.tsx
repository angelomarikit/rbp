import { useState } from 'react'
import { OrangeButton } from '../../components/ui/Buttons.tsx'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { SuccessModal } from '../../components/ui/SuccessModal.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { rbpField } from '../../components/ui/panels.ts'
import { useAuth } from '../../features/auth/AuthProvider.tsx'

export function AccountSettingsPage() {
  const { profile, updateEmail, updatePassword, signOut } = useAuth()
  const [email, setEmail] = useState(profile?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const saveEmail = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setSavingEmail(true)
    const result = await updateEmail(email)
    setSavingEmail(false)
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
      setError('The two passwords must match.')
      return
    }
    setSavingPassword(true)
    const result = await updatePassword(password)
    setSavingPassword(false)
    if (result.error) setError(result.error)
    else {
      setPassword('')
      setConfirm('')
      setNotice('Password updated.')
    }
  }

  return (
    <div className="max-w-lg">
      <GothicHeading as="h1" className="text-[3rem] leading-[0.9]">
        Settings
      </GothicHeading>
      {error && <p className="mt-4 text-sm text-[#ffb089]">{friendlyError(error)}</p>}
      {notice ? <SuccessModal message={notice} onClose={() => setNotice(null)} /> : null}
      {savingEmail || savingPassword ? <LoadingScreen label="Saving" full /> : null}
      <form className="mt-8 space-y-4" onSubmit={saveEmail}>
        <h2 className="text-sm uppercase tracking-[0.18em] text-rbp-cream">Email</h2>
        <input className={`${rbpField} h-11`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <OrangeButton type="submit" disabled={savingEmail}>
          {savingEmail ? 'Sending' : 'Update Email'}
        </OrangeButton>
      </form>
      <form className="mt-10 space-y-4" onSubmit={savePassword}>
        <h2 className="text-sm uppercase tracking-[0.18em] text-rbp-cream">Password</h2>
        <input className={`${rbpField} h-11`} type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className={`${rbpField} h-11`} type="password" autoComplete="new-password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <OrangeButton type="submit" disabled={savingPassword}>
          {savingPassword ? 'Saving' : 'Update Password'}
        </OrangeButton>
      </form>
      <button
        type="button"
        className="mt-10 text-sm text-rbp-accent"
        onClick={() => {
          void signOut()
        }}
      >
        Sign out
      </button>
    </div>
  )
}
