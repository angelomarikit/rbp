import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { OrangeButton } from '../../components/ui/Buttons.tsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { destinationForRole, useAuth } from '../../features/auth/AuthProvider.tsx'
import { AuthError, AuthLink, AuthShell, authField } from './AuthShell.tsx'

function safeNext(value: unknown) {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}

function destinationAfterLogin(
  role: 'admin' | 'customer' | 'reseller',
  resellerStatus: string | null,
  requested: string | null,
  resellerAttached: boolean,
) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'reseller' || resellerAttached) {
    if (requested?.startsWith('/wholesaler')) return requested
    if (requested?.startsWith('/reseller')) return requested.replace(/^\/reseller/, '/wholesaler')
    return destinationForRole('reseller', resellerStatus)
  }
  if (requested?.startsWith('/account')) return requested
  return '/account/dashboard'
}

export function LoginPage() {
  const { configured, signIn, user, profile, reseller, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading || submitting) return <LoadingScreen label={submitting ? 'Signing in' : 'Loading'} full />

  if (user && profile) {
    const requested = safeNext((location.state as { from?: string } | null)?.from)
    return (
      <Navigate
        to={destinationAfterLogin(profile.role, reseller?.status ?? null, requested, Boolean(reseller))}
        replace
      />
    )
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }
    setSubmitting(true)
    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.error || !result.role) {
      setError(result.error ?? 'Sign in failed.')
      return
    }
    const requested = safeNext((location.state as { from?: string } | null)?.from)
    navigate(
      destinationAfterLogin(
        result.role ?? 'customer',
        result.resellerStatus,
        requested,
        result.hasResellerPortal,
      ),
      { replace: true },
    )
  }

  return (
    <AuthShell
      kicker="Romell Body Piercing"
      title="Sign In"
      footer={
        <>
          <AuthLink to="/register">Create an account</AuthLink>
          <span className="mx-2 text-white/40">·</span>
          <AuthLink to="/forgot-password">Forgot password</AuthLink>
        </>
      }
    >
      {!configured && (
        <p className="mb-4 text-sm text-rbp-cream">Sign-in is not available right now.</p>
      )}
      <AuthError message={error} />
      <form className="space-y-4" onSubmit={submit}>
        <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
          Email
          <input className={`${authField} mt-2`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
          Password
          <input className={`${authField} mt-2`} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <OrangeButton type="submit" disabled={submitting || !configured} className="h-11 w-full">
          {submitting ? 'Signing in' : 'Sign In'}
        </OrangeButton>
      </form>
    </AuthShell>
  )
}
