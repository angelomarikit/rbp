import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OrangeButton } from '../../components/ui/Buttons.tsx'
import { destinationForRole, useAuth } from '../../features/auth/AuthProvider.tsx'
import { AuthError, AuthLink, AuthShell, authField } from './AuthShell.tsx'

export function RegisterPage() {
  const { configured, signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError('Full name, email, and phone number are required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }
    setSubmitting(true)
    const result = await signUp({ fullName, email, password, phone })
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.needsVerification) {
      setSent(true)
      return
    }
    navigate(destinationForRole(result.role ?? 'customer'), { replace: true })
  }

  if (sent) {
    return (
      <AuthShell kicker="Romell Body Piercing" title="Check Your Email" footer={<AuthLink to="/login">Back to sign in</AuthLink>}>
        <p className="text-center text-sm leading-relaxed text-white/80">
          A verification message is on its way to <span className="text-rbp-accent">{email.trim()}</span>. Open it to
          activate the account, then sign in. Admins go to the admin dashboard. Customers go to their account.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      kicker="Romell Body Piercing"
      title="Create Account"
      footer={<AuthLink to="/login">Already registered? Sign in</AuthLink>}
    >
      {!configured && (
        <p className="mb-4 text-sm text-rbp-cream">Supabase credentials are missing, so registration cannot create an account.</p>
      )}
      <AuthError message={error} />
      <form className="space-y-4" onSubmit={submit}>
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
        <OrangeButton type="submit" disabled={submitting || !configured} className="h-11 w-full">
          {submitting ? 'Creating account' : 'Create Account'}
        </OrangeButton>
      </form>
    </AuthShell>
  )
}
