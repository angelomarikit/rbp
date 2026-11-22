import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { NavItem } from './headerConfig.ts'

type Props = {
  open: boolean
  onClose: () => void
  items: NavItem[]
  pathname: string
}

export function MobileNav({ open, onClose, items, pathname }: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <nav className="absolute right-0 top-0 flex h-full w-[min(100%,320px)] flex-col gap-1 border-l border-rbp-border bg-rbp-surface p-6 pt-16 shadow-xl">
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center text-rbp-accent"
        >
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
            <path d="M6 6l14 14M20 6L6 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
        {items.map((item) => {
          const active = pathname === item.to.split('#')[0]
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              className={`border-b border-rbp-border/40 py-3 text-sm uppercase tracking-[0.12em] ${
                active ? 'text-rbp-accent' : 'text-rbp-text'
              }`}
            >
              {item.label.replace(' ⌄', '')}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}