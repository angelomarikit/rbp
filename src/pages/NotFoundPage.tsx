import { Link } from 'react-router-dom'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'

export function NotFoundPage() {
  return (
    <div className="flex w-full flex-col items-center bg-black px-6 py-24 text-center">
      <img src="/assets/rbp/branding/rbp-logo-nav.png" alt="" className="h-20 w-20 object-contain" />
      <GothicHeading as="h1" className="mt-6 text-[3rem] leading-none">
        Page not found
      </GothicHeading>
      <p className="mt-4 max-w-md text-sm text-white/75">That page is not available. Head back to the shop.</p>
      <Link to="/" className="mt-6 text-rbp-accent">
        Back to home
      </Link>
    </div>
  )
}
