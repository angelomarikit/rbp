import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../../../features/cart/CartProvider.tsx'
import { useSiteLogo } from '../../../features/site/SiteBrandingProvider.tsx'
import { IconCart, IconSearch, IconUser } from '../../ui/Icons.tsx'
import { OrangeBorderDivider } from '../../ui/OrangeDivider.tsx'
import { NAV_COLLECTIONS, type NavItem } from '../headerConfig.ts'
import { MobileNav } from '../MobileNav.tsx'
import { useState } from 'react'

function isActive(item: NavItem, pathname: string) {
  if (item.match?.some((m) => pathname === m || pathname.startsWith(m))) return true
  return item.to.split('#')[0] === pathname
}

/** Figma collections header ~111px + wordmark row */
export function CollectionsHeader() {
  const { pathname } = useLocation()
  const { itemCount } = useCart()
  const { logoSrc } = useSiteLogo()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="relative min-h-[111px] w-full bg-rbp-bg pb-px">
        <div className="flex w-full items-stretch gap-0 px-4 pt-2 lg:px-8">
          <Link to="/" className="shrink-0 py-1">
            <img src={logoSrc} alt="Romell Body Piercing" className="h-[75px] w-[75px] object-contain lg:ml-6" />
          </Link>
          <span className="hidden w-px shrink-0 self-stretch bg-rbp-border lg:mx-4 lg:block" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
            <p className="font-display text-[clamp(1.5rem,3vw,2.35rem)] leading-none text-rbp-accent">
              Romell Body Piercing
            </p>
            <nav className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] uppercase tracking-wide">
              {NAV_COLLECTIONS.map((item) => {
                const active = isActive(item, pathname)
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`relative pb-1 ${active ? 'text-rbp-accent' : 'text-rbp-text hover:text-rbp-accent'}`}
                  >
                    {item.label}
                    {active && <span className="absolute bottom-0 left-0 h-2 w-full bg-rbp-accent" />}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="ml-auto flex items-center gap-4 pb-2 pt-4">
            <IconSearch size={25} />
            <IconUser size={25} />
            <Link to="/checkout" className="relative">
              <IconCart size={27} />
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rbp-accent text-[11px] text-black">
                {itemCount}
              </span>
            </Link>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-rbp-accent lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <span className="flex flex-col gap-[5px]" aria-hidden>
                <span className="block h-[2px] w-6 bg-current" />
                <span className="block h-[2px] w-6 bg-current" />
                <span className="block h-[2px] w-6 bg-current" />
              </span>
            </button>
          </div>
        </div>
        <OrangeBorderDivider className="absolute bottom-0 left-0" />
      </header>
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} items={NAV_COLLECTIONS} pathname={pathname} />
    </>
  )
}