import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OrangeButton } from '../../components/ui/Buttons.tsx'
import { destinationForRole, useAuth } from '../../features/auth/AuthProvider.tsx'
import { supabase } from '../../lib/supabase.ts'
import { AuthError, AuthLink, AuthShell, authField } from './AuthShell.tsx'

export function ResetPasswordPage() {
  const { updatePassword, profile } = useAuth()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) setReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('The two passwords must match.')
      return
    }
    setSubmitting(true)
    const result = await updatePassword(password)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate(profile ? destinationForRole(profile.role) : '/account/dashboard', { replace: true })
  }

  return (
    <AuthShell kicker="Romell Body Piercing" title="New Password" footer={<AuthLink to="/login">Back to sign in</AuthLink>}>
      {!ready ? (
        <p className="text-center text-sm leading-relaxed text-white/80">
          Open the recovery link from your email on this browser. The form appears after Supabase confirms the link.
        </p>
      ) : (
        <>
          <AuthError message={error} />
          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
              New password
              <input className={`${authField} mt-2`} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
              Confirm password
              <input className={`${authField} mt-2`} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            <OrangeButton type="submit" disabled={submitting} className="h-11 w-full">
              {submitting ? 'Saving' : 'Save Password'}
            </OrangeButton>
          </form>
        </>
      )}
    </AuthShell>
  )
}
