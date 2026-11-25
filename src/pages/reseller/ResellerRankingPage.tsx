import { useEffect, useState } from 'react'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { type ResellerRankingRow } from '../../features/reseller/types.ts'
import { useAuth } from '../../features/auth/AuthProvider.tsx'
import { formatPhp } from '../../lib/format.ts'
import { friendlyError } from '../../lib/friendlyError.ts'
import { supabase } from '../../lib/supabase.ts'

export function ResellerRankingPage() {
  const { reseller } = useAuth()
  const [rows, setRows] = useState<ResellerRankingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.rpc('reseller_rankings').then(({ data, error: rpcError }) => {
      if (!active) return
      if (rpcError) setError(rpcError.message)
      else setRows((data ?? []) as ResellerRankingRow[])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  if (loading) return <LoadingScreen label="Loading ranking" />

  return (
    <div>
      <GothicHeading as="h1" className="text-[3rem] leading-[0.9]">
        Leaderboard
      </GothicHeading>
      <p className="mt-3 max-w-xl text-sm text-rbp-cream">
        Rankings use verified orders only — payment must be confirmed in admin before sales count here.
      </p>
      {error && <p className="mt-4 text-sm text-[#ffb089]">{friendlyError(error)}</p>}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-rbp-border text-[11px] uppercase tracking-[0.14em] text-rbp-cream">
              <th className="py-2 pr-4">Rank</th>
              <th className="py-2 pr-4">Reseller</th>
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Orders</th>
              <th className="py-2">Verified total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const highlight = row.reseller_id === reseller?.id
              return (
                <tr
                  key={row.reseller_id}
                  className={`border-b border-rbp-border/60 ${highlight ? 'bg-rbp-accent/10' : ''}`}
                >
                  <td className="py-3 pr-4 text-white">{index + 1}</td>
                  <td className="py-3 pr-4 text-white">{row.full_name}</td>
                  <td className="py-3 pr-4 text-rbp-accent">{row.discount_code || '—'}</td>
                  <td className="py-3 pr-4 text-white/80">{row.order_count}</td>
                  <td className="py-3 text-rbp-accent">{formatPhp(Number(row.total_cents))}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && !error && <p className="mt-4 text-sm text-rbp-cream">No approved resellers yet.</p>}
      </div>
    </div>
  )
}