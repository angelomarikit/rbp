import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { destinationForRole, useAuth } from './AuthProvider.tsx'

export function RequireAuth() {
  const { loading, user, profile, profileError, configured } = useAuth()
  const location = useLocation()

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl text-rbp-accent">Account</h1>
        <p className="mt-4 text-sm text-rbp-cream">Accounts are not available right now. Please try again later.</p>
      </div>
    )
  }

  if (loading) {
    return <LoadingScreen label="Loading" full />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl text-rbp-accent">Profile</h1>
        <p className="mt-4 text-sm text-rbp-cream">{friendlyError(profileError, 'We could not open your account.')}</p>
      </div>
    )
  }

  return <Outlet />
}

export function RequireCustomer() {
  const { loading, profile } = useAuth()
  if (loading) {
    return <LoadingScreen label="Loading" full />
  }
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { loading, profile } = useAuth()
  if (loading) {
    return <LoadingScreen label="Loading" full />
  }
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'admin') return <Navigate to={destinationForRole(profile.role)} replace />
  return <Outlet />
}
