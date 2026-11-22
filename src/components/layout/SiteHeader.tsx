import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider.tsx'
import { useCart } from '../../features/cart/CartProvider.tsx'
import { LOGO } from '../../lib/assets.ts'
import { IconCart, IconSearch, IconUser } from '../ui/Icons.tsx'
import { NAV_HOME, type HeaderVariant, type NavItem } from './headerConfig.ts'
import { MobileNav } from './MobileNav.tsx'

function matches(item: NavItem, pathname: string) {
  return Boolean(
    item.match?.some((m) => pathname === m || (m !== '/' && pathname.startsWith(m))),
  )
}

function isActive(item: NavItem, pathname: string, nav: NavItem[]) {
  if (item.match) return matches(item, pathname)
  const claimed = nav.some((other) => other !== item && matches(other, pathname))
  const base = item.to.split('#')[0]
  if (claimed) return false
  if (base === '/' ) return pathname === '/'
  return pathname === base
}

export function SiteHeader({ variant: _variant }: { variant: HeaderVariant }) {
  const { pathname } = useLocation()
  const { itemCount } = useCart()
  const nav = NAV_HOME
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 w-full bg-black">
        <HomeBar nav={nav} pathname={pathname} itemCount={itemCount} onMenu={() => setMenuOpen(true)} />
        <div className="header-glow" />
      </header>
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} items={nav} pathname={pathname} />
    </>
  )
}

function LogoMark({ size = 78 }: { size?: number }) {
  return (
    <Link to="/" className="shrink-0" aria-label="Romell Body Piercing home">
      <img
        src={LOGO}
        alt="Romell Body Piercing"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
    </Link>
  )
}

function NavRow({
  nav,
  pathname,
  className = '',
}: {
  nav: NavItem[]
  pathname: string
  className?: string
}) {
  return (
    <nav className={`hidden items-center gap-x-5 xl:flex ${className}`}>
      {nav.map((item) => {
        const active = isActive(item, pathname, nav)
        const label = item.label.replace(' ⌄', '')
        const dropdown = item.label.includes('⌄')
        return (
          <Link
            key={item.label}
            to={item.to}
            className={`relative whitespace-nowrap pb-1 text-[13px] font-medium uppercase tracking-[0.12em] ${
              active ? 'text-rbp-accent' : 'text-white hover:text-rbp-accent'
            }`}
          >
            {label}
            {dropdown && <span className="ml-1 text-[10px]">▾</span>}
            {active && <span className="absolute -bottom-0.5 left-0 h-[2px] w-full bg-rbp-accent" />}
          </Link>
        )
      })}
    </nav>
  )
}

function Actions({ itemCount }: { itemCount: number }) {
  const { user, profile } = useAuth()
  const accountTo = !user ? '/login' : profile?.role === 'admin' ? '/admin/dashboard' : '/account/dashboard'

  return (
    <div className="flex shrink-0 items-center gap-3.5 text-rbp-accent">
      <IconSearch size={20} />
      <Link to={accountTo} aria-label={user ? 'Account' : 'Sign in'}>
        <IconUser size={20} />
      </Link>
      <Link to="/checkout" className="relative" aria-label="Cart">
        <IconCart size={22} />
        <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rbp-accent px-1 text-[10px] font-bold text-black">
          {itemCount}
        </span>
      </Link>
    </div>
  )
}

function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex h-9 w-9 items-center justify-center text-rbp-accent xl:hidden"
      onClick={onClick}
      aria-label="Open menu"
    >
      <span className="flex flex-col gap-[5px]" aria-hidden>
        <span className="block h-[2px] w-6 bg-current" />
        <span className="block h-[2px] w-6 bg-current" />
        <span className="block h-[2px] w-6 bg-current" />
      </span>
    </button>
  )
}

function HomeBar({
  nav,
  pathname,
  itemCount,
  onMenu,
}: {
  nav: NavItem[]
  pathname: string
  itemCount: number
  onMenu: () => void
}) {
  return (
    <div className="relative flex h-[88px] items-center justify-center px-4 lg:px-6">
      <div className="flex items-center gap-8">
        <LogoMark size={72} />
        <NavRow nav={nav} pathname={pathname} className="gap-x-7" />
      </div>
      <div className="absolute right-4 z-10 flex items-center gap-3 lg:right-6">
        <Actions itemCount={itemCount} />
        <MenuButton onClick={onMenu} />
      </div>
    </div>
  )
}

