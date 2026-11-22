import { Outlet, useLocation } from 'react-router-dom'
import { HelpWidget } from '../help/HelpWidget.tsx'
import { MemberStrip } from './MemberStrip.tsx'
import { SiteHeader } from './SiteHeader.tsx'
import { variantFromPath } from './headerConfig.ts'

export function SiteLayout() {
  const { pathname } = useLocation()
  const variant = variantFromPath(pathname)

  return (
    <div className="flex min-h-screen w-full flex-col bg-black">
      <SiteHeader variant={variant} />
      <main className="w-full flex-1 pt-[90px]">
        <Outlet />
      </main>
      <MemberStrip />
      <HelpWidget />
    </div>
  )
}