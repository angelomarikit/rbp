import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { rbpField, rbpPanel } from '../../components/ui/panels.ts'
import { friendlyError } from '../../lib/friendlyError.ts'

export const authField = `${rbpField} h-11 [color-scheme:dark]`

export function AuthShell({
  kicker,
  title,
  children,
  footer,
}: {
  kicker: string
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex w-full justify-center bg-black px-5 py-16">
      <div className={`w-full max-w-md px-6 py-10 sm:px-8 ${rbpPanel}`}>
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.28em] text-rbp-cream">{kicker}</p>
        <GothicHeading as="h1" className="mt-3 text-center text-[2.7rem] leading-[0.9]">
          {title}
        </GothicHeading>
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-white/80">{footer}</div>}
      </div>
    </div>
  )
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="mb-4 text-sm text-[#ffb089]">{friendlyError(message)}</p>
}

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-rbp-accent">
      {children}
    </Link>
  )
}
