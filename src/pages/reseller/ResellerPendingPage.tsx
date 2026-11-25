import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { rbpPanel } from '../../components/ui/panels.ts'
import { useAuth } from '../../features/auth/AuthProvider.tsx'

const statusCopy: Record<string, string> = {
  pending: 'Your application is with the studio for review.',
  rejected: 'This application was not approved. Contact the studio if you have questions.',
  suspended: 'Your reseller account is suspended. Contact the studio for help.',
}

export function ResellerPendingPage() {
  const { profile, reseller } = useAuth()
  const status = reseller?.status ?? 'pending'

  return (
    <div>
      <GothicHeading as="h1" className="text-[3rem] leading-[0.9]">
        Reseller application
      </GothicHeading>
      <p className="mt-4 max-w-xl text-sm text-rbp-cream">{statusCopy[status] ?? statusCopy.pending}</p>
      {reseller?.admin_note && status !== 'pending' && (
        <p className="mt-2 text-sm text-[#ffb089]">Note from studio: {reseller.admin_note}</p>
      )}
      <div className={`mt-8 space-y-2 ${rbpPanel} p-5 text-sm text-white/85`}>
        <p>
          <span className="text-rbp-cream">Name:</span> {profile?.full_name || '—'}
        </p>
        <p>
          <span className="text-rbp-cream">Email:</span> {profile?.email}
        </p>
        <p>
          <span className="text-rbp-cream">Phone:</span> {profile?.phone || '—'}
        </p>
        {reseller && (
          <>
            <p className="pt-2 text-xs uppercase tracking-[0.16em] text-rbp-accent">Submitted address</p>
            <p>
              {reseller.address_line}, {reseller.barangay}, {reseller.city}, {reseller.province}{' '}
              {reseller.postal_code}
            </p>
          </>
        )}
      </div>
    </div>
  )
}