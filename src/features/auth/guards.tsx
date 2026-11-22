import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { destinationForRole, useAuth } from './AuthProvider.tsx'

export function RequireAuth() {
  const { loading, user, profile, profileError, configured } = useAuth()
  const location = useLocation()

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl text-rbp-accent">Account</h1>
        <p className="mt-4 text-sm text-rbp-cream">
          Add the Supabase URL and anon key, then run migrations 005 through 012.
        </p>
      </div>
    )
  }

  if (loading) {
    return <p className="px-6 py-20 text-center text-sm uppercase tracking-[0.2em] text-rbp-cream">Loading account</p>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-4xl text-rbp-accent">Profile</h1>
        <p className="mt-4 text-sm text-rbp-cream">{profileError ?? 'This account has no profile row yet.'}</p>
      </div>
    )
  }

  return <Outlet />
}

export function RequireCustomer() {
  const { loading, profile } = useAuth()
  if (loading) {
    return <p className="px-6 py-20 text-center text-sm uppercase tracking-[0.2em] text-rbp-cream">Loading account</p>
  }
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { loading, profile } = useAuth()
  if (loading) {
    return <p className="px-6 py-20 text-center text-sm uppercase tracking-[0.2em] text-rbp-cream">Loading account</p>
  }
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'admin') return <Navigate to={destinationForRole(profile.role)} replace />
  return <Outlet />
}
