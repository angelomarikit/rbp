import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider.tsx'

const links = [
  { to: '/account/dashboard', label: 'Dashboard' },
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/addresses', label: 'Addresses' },
  { to: '/account/orders', label: 'Orders' },
  { to: '/account/settings', label: 'Settings' },
]

export function AccountLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
      <aside className="border border-rbp-border bg-[#080808] p-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-rbp-cream">Your account</p>
        <p className="mt-2 text-sm text-white">{profile?.full_name || profile?.email}</p>
        <nav className="mt-5 flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 text-[13px] uppercase tracking-[0.14em] ${
                  isActive ? 'bg-rbp-accent text-black' : 'text-white hover:text-rbp-accent'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="mt-6 px-3 text-left text-sm text-rbp-accent" onClick={() => void signOut()}>
          Sign out
        </button>
      </aside>
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  )
}
