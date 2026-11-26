import { useEffect, useState } from 'react'
import { friendlyError } from '../../lib/friendlyError.ts'
import { supabase, supabaseConfigured } from '../../lib/supabase.ts'
import { WHOLESALER_STANDARD_DISCOUNT_PERCENT } from '../../lib/wholesalerDiscount.ts'
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
  full_name: string
  email: string
  phone: string | null
}

function suggestCode(name: string | null | undefined) {
  const base = (name ?? 'RBP').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'RBP'
  const suffix = Math.floor(10 + Math.random() * 89)
  return `${base}${suffix}`
}

function emptyDraft(row: ResellerAdminRow): { code: string; percent: string; note: string } {
  return {
    code: row.discount_code ?? suggestCode(row.full_name),
    percent: row.discount_percent ? String(row.discount_percent) : String(WHOLESALER_STANDARD_DISCOUNT_PERCENT),
    note: row.admin_note ?? '',
  }
}

export function ResellersAdmin() {
  const [rows, setRows] = useState<ResellerAdminRow[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('pending')
  const [drafts, setDrafts] = useState<Record<string, { code: string; percent: string; note: string }>>({})
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!supabase) {
      setError('Database is not configured.')
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('admin_list_resellers')
    setLoading(false)
    if (rpcError) {
      const message = rpcError.message ?? ''
      if (message.includes('Admin only')) {
        setError('Sign in with an admin studio account to view wholesaler applications.')
        setRows([])
        return
      }
      const { data: tableData, error: tableError } = await supabase
        .from('resellers')
        .select(
          `id, profile_id, status, discount_code, discount_percent, province, city, barangay, postal_code, address_line, admin_note, created_at,
          profiles (full_name, email, phone)`,
        )
        .order('created_at', { ascending: false })
      if (tableError) {
        setError(
          friendlyError(
            tableError,
            'Could not load wholesalers. Run Supabase migrations 023–026 on your project.',
          ),
        )
        setRows([])
        return
      }
      const list = (tableData ?? []).map((row) => ({
        ...(row as Omit<ResellerAdminRow, 'full_name' | 'email' | 'phone'>),
        full_name:
          (Array.isArray(row.profiles) ? row.profiles[0]?.full_name : (row.profiles as { full_name?: string } | null)?.full_name) ??
          '',
        email:
          (Array.isArray(row.profiles) ? row.profiles[0]?.email : (row.profiles as { email?: string } | null)?.email) ?? '',
        phone:
          (Array.isArray(row.profiles) ? row.profiles[0]?.phone : (row.profiles as { phone?: string } | null)?.phone) ?? null,
      })) as ResellerAdminRow[]
      setError(
        list.length
          ? null
          : 'No wholesaler applications in the database yet. Applicants must submit the form at /wholesaler/register while signed in.',
      )
      setRows(list)
      setDrafts((prev) => {
        const next = { ...prev }
        for (const row of list) {
          if (!next[row.id]) next[row.id] = emptyDraft(row)
        }
        return next
      })
      return
    }
    setError(null)
    const list = (data ?? []) as ResellerAdminRow[]
    if (!list.length) {
      setError(
        'No wholesaler applications yet. Each applicant must complete /wholesaler/register while signed in (verify email first if required).',
      )
    }
    setRows(list)
    setDrafts((prev) => {
      const next = { ...prev }
      for (const row of list) {
        if (!next[row.id]) next[row.id] = emptyDraft(row)
      }
      return next
    })
  }

  useEffect(() => {
    void load()
  }, [])

  const visible = filter === 'all' ? rows : rows.filter((row) => row.status === filter)
  const pendingCount = rows.filter((row) => row.status === 'pending').length

  const saveReseller = async (
    row: ResellerAdminRow,
    status: 'approved' | 'rejected' | 'suspended' | 'pending',
  ) => {
    if (!supabase) return
    setError(null)
    setOk(null)
    const draft = drafts[row.id] ?? emptyDraft(row)
    const code = draft.code.trim().toUpperCase()
    const percent = Number(draft.percent)
    if (status === 'approved') {
      if (!code) {
        setError('Discount code is required to approve.')
        return
      }
      if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
        setError('Discount percent must be between 1 and 100.')
        return
      }
    }
    const { error: rpcError } = await supabase.rpc('admin_update_reseller', {
      p_reseller_id: row.id,
      p_status: status,
      p_discount_code: status === 'approved' ? code : row.discount_code,
      p_discount_percent: status === 'approved' ? percent : row.discount_percent,
      p_admin_note: draft.note.trim() || null,
    })
    if (rpcError) {
      setError(friendlyError(rpcError, 'Update failed.'))
      return
    }
    if (status === 'approved') {
      setOk(`Approved ${row.email || 'wholesaler'} with code ${code} at ${percent}% off subtotal.`)
    } else {
      setOk(`Wholesaler marked ${status}.`)
    }
    await load()
  }

  const updateApprovedCode = async (row: ResellerAdminRow) => {
    await saveReseller(row, 'approved')
  }

  const removeReseller = async (row: ResellerAdminRow) => {
    if (!supabase) return
    const label = row.full_name || row.email || 'this wholesaler'
    const confirmed = window.confirm(
      `Remove ${label}? Their checkout code will stop working. Past orders stay on file; the account can become a regular customer again.`,
    )
    if (!confirmed) return
    setError(null)
    setOk(null)
    const { error: rpcError } = await supabase.rpc('admin_delete_reseller', {
      p_reseller_id: row.id,
      p_revert_profile_to_customer: true,
    })
    if (rpcError) {
      setError(friendlyError(rpcError, 'Could not remove this wholesaler.'))
      return
    }
    setOk(`Removed ${label}.`)
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[row.id]
      return next
    })
    await load()
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">Wholesalers</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#9a9a9a]">
          Review applications, assign a unique checkout code and discount percent, then approve or reject. You can remove a
          wholesaler to disable their code (orders already placed are kept). Ranking uses verified orders only.
        </p>
        {!supabaseConfigured && (
          <p className="mt-2 text-sm text-[#ffb089]">Supabase is not connected — this page cannot load applications.</p>
        )}
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
            {id === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </nav>
      <Notice error={error} ok={ok} />
      {loading && <p className="text-sm text-[#9a9a9a]">Loading applications…</p>}
      {!loading && visible.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#444] px-4 py-8 text-sm text-[#9a9a9a]">
          {filter === 'pending'
            ? 'No pending applications. If someone applied but you expected a row here, run migration 024 on Supabase and ask them to submit again at /wholesaler/register while signed in.'
            : 'No wholesalers in this list.'}
        </div>
      )}
      {visible.map((row) => (
        <Card key={row.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-white">{row.full_name || row.email || 'Wholesaler'}</p>
              <p className="text-xs text-[#9a9a9a]">
                {row.email} · {row.phone || '—'}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[#ffb067]">{row.status}</p>
            </div>
            <p className="text-xs text-[#8d8d8d]">{new Date(row.created_at).toLocaleString()}</p>
          </div>
          <p className="mt-3 text-sm text-[#c8c8c8]">
            {row.address_line}, {row.barangay}, {row.city}, {row.province} {row.postal_code}
          </p>
          {(row.status === 'pending' || row.status === 'approved') && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-[#9a9a9a]">
                Discount code
                <input
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white uppercase"
                  value={drafts[row.id]?.code ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [row.id]: { ...(prev[row.id] ?? emptyDraft(row)), code: e.target.value.toUpperCase() },
                    }))
                  }
                />
              </label>
              <label className="text-xs text-[#9a9a9a]">
                Percent off subtotal
                <input
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                  inputMode="numeric"
                  value={drafts[row.id]?.percent ?? String(WHOLESALER_STANDARD_DISCOUNT_PERCENT)}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [row.id]: { ...(prev[row.id] ?? emptyDraft(row)), percent: e.target.value },
                    }))
                  }
                />
              </label>
              <label className="text-xs text-[#9a9a9a] sm:col-span-1">
                Note (optional)
                <input
                  className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                  value={drafts[row.id]?.note ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [row.id]: { ...(prev[row.id] ?? emptyDraft(row)), note: e.target.value },
                    }))
                  }
                />
              </label>
            </div>
          )}
          {row.status === 'approved' && (
            <p className="mt-2 text-xs text-[#8d8d8d]">
              Current live code: {row.discount_code ?? '—'} · {row.discount_percent ?? '—'}%
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {row.status === 'pending' && (
              <>
                <PrimaryButton type="button" onClick={() => void saveReseller(row, 'approved')}>
                  Approve with code
                </PrimaryButton>
                <button
                  type="button"
                  className="rounded-lg border border-[#444] px-3 py-2 text-sm"
                  onClick={() => void saveReseller(row, 'rejected')}
                >
                  Decline
                </button>
              </>
            )}
            {row.status === 'approved' && (
              <>
                <PrimaryButton type="button" onClick={() => void updateApprovedCode(row)}>
                  Save code &amp; percent
                </PrimaryButton>
                <button
                  type="button"
                  className="rounded-lg border border-[#444] px-3 py-2 text-sm"
                  onClick={() => void saveReseller(row, 'suspended')}
                >
                  Suspend
                </button>
              </>
            )}
            <button
              type="button"
              className="rounded-lg border border-[#663333] px-3 py-2 text-sm text-[#ffb0b0] hover:border-[#aa4444]"
              onClick={() => void removeReseller(row)}
            >
              Remove wholesaler
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}