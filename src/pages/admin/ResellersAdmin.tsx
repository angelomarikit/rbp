import { useEffect, useState } from 'react'
import { useAuth } from '../../features/auth/AuthProvider.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { supabase } from '../../lib/supabase.ts'
import { Card, Notice, PrimaryButton } from './ui.tsx'

type ResellerAdminRow = {
  id: string
  profile_id: string
  status: string
  discount_code: string | null
  discount_percent: number | null
  province: string
  city: string
  barangay: string
  postal_code: string
  address_line: string
  admin_note: string | null
  created_at: string
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null
}

function suggestCode(name: string | null | undefined) {
  const base = (name ?? 'RBP').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'RBP'
  const suffix = Math.floor(10 + Math.random() * 89)
  return `${base}${suffix}`
}

export function ResellersAdmin() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<ResellerAdminRow[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all')
  const [drafts, setDrafts] = useState<Record<string, { code: string; percent: string; note: string }>>({})
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const load = async () => {
    const { data, error: queryError } = await supabase!
      .from('resellers')
      .select(
        `id, profile_id, status, discount_code, discount_percent, province, city, barangay, postal_code, address_line, admin_note, created_at,
        profiles (full_name, email, phone)`,
      )
      .order('created_at', { ascending: false })
    if (queryError) setError(queryError.message)
    else {
      const list = (data ?? []).map((row) => ({
        ...(row as Omit<ResellerAdminRow, 'profiles'>),
        profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : (row.profiles as ResellerAdminRow['profiles']),
      })) as ResellerAdminRow[]
      setRows(list)
      setDrafts((prev) => {
        const next = { ...prev }
        for (const row of list) {
          if (!next[row.id]) {
            next[row.id] = {
              code: row.discount_code ?? suggestCode(row.profiles?.full_name),
              percent: row.discount_percent ? String(row.discount_percent) : '15',
              note: row.admin_note ?? '',
            }
          }
        }
        return next
      })
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const visible = filter === 'all' ? rows : rows.filter((row) => row.status === filter)

  const approve = async (row: ResellerAdminRow) => {
    setError(null)
    setOk(null)
    const draft = drafts[row.id]
    const code = draft.code.trim().toUpperCase()
    const percent = Number(draft.percent)
    if (!code) {
      setError('Discount code is required to approve.')
      return
    }
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
      setError('Discount percent must be between 1 and 100.')
      return
    }
    const { error: updateError } = await supabase!
      .from('resellers')
      .update({
        status: 'approved',
        discount_code: code,
        discount_percent: percent,
        approved_at: new Date().toISOString(),
        approved_by: profile?.id ?? null,
        admin_note: draft.note.trim() || null,
      })
      .eq('id', row.id)
    if (updateError) setError(friendlyError(updateError, 'Approval failed.'))
    else {
      setOk(`Approved ${row.profiles?.email ?? 'reseller'} with code ${code}.`)
      await load()
    }
  }

  const setStatus = async (row: ResellerAdminRow, status: 'rejected' | 'suspended') => {
    setError(null)
    setOk(null)
    const note = drafts[row.id]?.note?.trim() || null
    const { error: updateError } = await supabase!
      .from('resellers')
      .update({ status, admin_note: note })
      .eq('id', row.id)
    if (updateError) setError(updateError.message)
    else {
      setOk(`Reseller marked ${status}.`)
      await load()
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">Resellers</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">
          Review applications, assign a unique checkout code and discount percent, then approve or reject.
        </p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={`rounded-full border px-3 py-1.5 text-sm capitalize ${
              filter === id ? 'border-[#FF7900] bg-[#2a1608] text-white' : 'border-[#333] text-[#b5b5b5]'
            }`}
            onClick={() => setFilter(id)}
          >
            {id}
          </button>
        ))}
      </nav>
      <Notice error={error} ok={ok} />
      {visible.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#444] px-4 py-8 text-sm text-[#9a9a9a]">No resellers in this list.</div>
      )}
      {visible.map((row) => (
        <Card key={row.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-white">{row.profiles?.full_name || row.profiles?.email || 'Reseller'}</p>
              <p className="text-xs text-[#9a9a9a]">
                {row.profiles?.email} · {row.profiles?.phone || '—'}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[#ffb067]">{row.status}</p>
            </div>
            <p className="text-xs text-[#8d8d8d]">{new Date(row.created_at).toLocaleString()}</p>
          </div>
          <p className="mt-3 text-sm text-[#c8c8c8]">
            {row.address_line}, {row.barangay}, {row.city}, {row.province} {row.postal_code}
          </p>
          {row.status === 'approved' && (
            <p className="mt-2 text-sm text-[#ffb067]">
              Code {row.discount_code} · {row.discount_percent}% off subtotal
            </p>
          )}
          {row.status === 'pending' && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-[#9a9a9a]">
                Discount code
                <input
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                  value={drafts[row.id]?.code ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], code: e.target.value.toUpperCase() } }))
                  }
                />
              </label>
              <label className="text-xs text-[#9a9a9a]">
                Percent off
                <input
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                  inputMode="numeric"
                  value={drafts[row.id]?.percent ?? '15'}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], percent: e.target.value } }))
                  }
                />
              </label>
              <label className="text-xs text-[#9a9a9a] sm:col-span-1">
                Note (optional)
                <input
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                  value={drafts[row.id]?.note ?? ''}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], note: e.target.value } }))}
                />
              </label>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {row.status === 'pending' && (
              <PrimaryButton type="button" onClick={() => void approve(row)}>
                Approve
              </PrimaryButton>
            )}
            {row.status === 'pending' && (
              <button type="button" className="rounded-lg border border-[#444] px-3 py-2 text-sm" onClick={() => void setStatus(row, 'rejected')}>
                Reject
              </button>
            )}
            {row.status === 'approved' && (
              <button type="button" className="rounded-lg border border-[#444] px-3 py-2 text-sm" onClick={() => void setStatus(row, 'suspended')}>
                Suspend
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}