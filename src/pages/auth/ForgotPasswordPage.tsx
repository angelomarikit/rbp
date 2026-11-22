import { useState } from 'react'
import { OrangeButton } from '../../components/ui/Buttons.tsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { useAuth } from '../../features/auth/AuthProvider.tsx'
import { AuthError, AuthLink, AuthShell, authField } from './AuthShell.tsx'

export function ForgotPasswordPage() {
  const { configured, sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter the email on your account.')
      return
    }
    setSubmitting(true)
    const result = await sendPasswordReset(email)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  if (submitting) return <LoadingScreen label="Sending the link" full />

  return (
    <AuthShell kicker="Romell Body Piercing" title="Reset Password" footer={<AuthLink to="/login">Back to sign in</AuthLink>}>
      {sent ? (
        <p className="text-center text-sm leading-relaxed text-white/80">
          If an account exists for <span className="text-rbp-accent">{email.trim()}</span>, a recovery link is on its way. Open it in this browser.
        </p>
      ) : (
        <>
          <AuthError message={error} />
          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
              Email
              <input className={`${authField} mt-2`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <OrangeButton type="submit" disabled={submitting || !configured} className="h-11 w-full">
              {submitting ? 'Sending' : 'Send Recovery Link'}
            </OrangeButton>
          </form>
        </>
      )}
    </AuthShell>
  )
}
