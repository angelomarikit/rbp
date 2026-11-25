import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider.tsx'

const groups = [
  { label: '', items: [{ to: '/admin/dashboard', label: 'Home' }] },
  {
    label: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders' },
      { to: '/admin/inquiries', label: 'Inquiries' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products' },
      { to: '/admin/collections', label: 'Collections' },
    ],
  },
  {
    label: 'Online store',
    items: [
      { to: '/admin/homepage', label: 'Homepage' },
      { to: '/admin/events', label: 'Events' },
      { to: '/admin/gallery', label: 'Association' },
      { to: '/admin/about', label: 'About' },
      { to: '/admin/contact', label: 'Contact' },
    ],
  },
  { label: '', items: [{ to: '/admin/settings', label: 'Settings' }] },
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-[#1a1a1a] font-body text-[#f3f3f3]">
      <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-[#2a2a2a] bg-[#111111] px-3 py-4">
        <div className="px-2 pb-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#9a9a9a]">Romell</p>
          <p className="text-sm font-semibold text-white">Body Piercing</p>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.label || group.items[0].to}>
              {group.label && <p className="px-2 pb-1 text-[11px] font-medium text-[#7d7d7d]">{group.label}</p>}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-lg px-2 py-1.5 text-[13px] ${
                        isActive ? 'bg-[#2a2a2a] font-medium text-white shadow-[inset_2px_0_0_#FF7900]' : 'text-[#c8c8c8] hover:bg-[#1c1c1c] hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="space-y-2 border-t border-[#2a2a2a] px-2 pt-3 text-[13px]">
          <p className="truncate text-[#8d8d8d]">{profile?.email}</p>
          <Link to="/" className="block text-[#ffb067]">
            View store
          </Link>
          <button type="button" className="text-[#c8c8c8]" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
