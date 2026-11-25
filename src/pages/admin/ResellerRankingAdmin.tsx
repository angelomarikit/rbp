import { useEffect, useState } from 'react'
import { type ResellerRankingRow } from '../../features/reseller/types.ts'
import { formatPhp } from '../../lib/format.ts'
import { friendlyError } from '../../lib/friendlyError.ts'
import { supabase } from '../../lib/supabase.ts'
import { Notice } from './ui.tsx'

export function ResellerRankingAdmin() {
  const [rows, setRows] = useState<ResellerRankingRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void supabase!.rpc('reseller_rankings').then(({ data, error: rpcError }) => {
      if (rpcError) setError(rpcError.message)
      else setRows((data ?? []) as ResellerRankingRow[])
    })
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">Wholesaler ranking</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">
          Totals and order counts include only orders with payment status verified, attributed to each wholesaler code at checkout.
        </p>
      </div>
      <Notice error={error ? friendlyError(error) : null} ok={null} />
      <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-[#161616] text-[11px] uppercase tracking-[0.14em] text-[#9a9a9a]">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Wholesaler</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Verified orders</th>
              <th className="px-4 py-3">Verified total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.reseller_id} className="border-t border-[#2a2a2a] text-[#e0e0e0]">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{row.full_name}</td>
                <td className="px-4 py-3 text-[#ffb067]">{row.discount_code || '—'}</td>
                <td className="px-4 py-3">{row.order_count}</td>
                <td className="px-4 py-3">{formatPhp(Number(row.total_cents))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !error && (
          <p className="px-4 py-8 text-sm text-[#9a9a9a]">No verified attributed sales yet.</p>
        )}
      </div>
    </div>
  )
}