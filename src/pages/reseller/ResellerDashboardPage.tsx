import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { type ResellerRankingRow } from '../../features/reseller/types.ts'
import { useAuth } from '../../features/auth/AuthProvider.tsx'
import { formatPhp } from '../../lib/format.ts'
import { friendlyError } from '../../lib/friendlyError.ts'
import { rbpPanel } from '../../components/ui/panels.ts'
import { supabase } from '../../lib/supabase.ts'

export function ResellerDashboardPage() {
  const { reseller } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verifiedTotal, setVerifiedTotal] = useState(0)
  const [verifiedCount, setVerifiedCount] = useState(0)
  const [rank, setRank] = useState<number | null>(null)

  useEffect(() => {
    if (!supabase || !reseller?.id) return
    let active = true
    const client = supabase!
    const load = async () => {
      const [ordersResult, rankingResult] = await Promise.all([
        client
          .from('orders')
          .select('total_cents, payment_status')
          .eq('reseller_id', reseller.id),
        client.rpc('reseller_rankings'),
      ])
      if (!active) return
      if (ordersResult.error) setError(ordersResult.error.message)
      else {
        const verified = (ordersResult.data ?? []).filter((row) => row.payment_status === 'verified')
        setVerifiedCount(verified.length)
        setVerifiedTotal(verified.reduce((sum, row) => sum + (row.total_cents as number), 0))
      }
      if (!rankingResult.error && rankingResult.data) {
        const rows = rankingResult.data as ResellerRankingRow[]
        const index = rows.findIndex((row) => row.reseller_id === reseller.id)
        setRank(index >= 0 ? index + 1 : null)
      }
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [reseller?.id])

  if (loading) return <LoadingScreen label="Loading dashboard" />
  if (error) return <p className="text-sm text-[#ffb089]">{friendlyError(error)}</p>

  return (
    <div>
      <GothicHeading as="h1" className="text-[3rem] leading-[0.9]">
        Dashboard
      </GothicHeading>
      <p className="mt-3 text-sm text-rbp-cream">
        Verified sales attributed to code{' '}
        <span className="text-rbp-accent">{reseller?.discount_code ?? '—'}</span>.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className={`${rbpPanel} p-4`}>
          <p className="text-xs uppercase tracking-[0.16em] text-rbp-cream">Verified sales</p>
          <p className="mt-2 text-2xl text-rbp-accent">{formatPhp(verifiedTotal)}</p>
        </div>
        <div className={`${rbpPanel} p-4`}>
          <p className="text-xs uppercase tracking-[0.16em] text-rbp-cream">Verified orders</p>
          <p className="mt-2 text-2xl text-white">{verifiedCount}</p>
        </div>
        <div className={`${rbpPanel} p-4`}>
          <p className="text-xs uppercase tracking-[0.16em] text-rbp-cream">Leaderboard</p>
          <p className="mt-2 text-2xl text-white">{rank ? `#${rank}` : '—'}</p>
        </div>
      </div>
      <Link to="/wholesaler/orders" className="mt-6 inline-block text-sm text-rbp-accent">
        View orders →
      </Link>
    </div>
  )
}