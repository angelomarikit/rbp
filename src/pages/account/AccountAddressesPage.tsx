import { useEffect, useState } from 'react'
import { OrangeButton } from '../../components/ui/Buttons.tsx'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { rbpField, rbpPanel } from '../../components/ui/panels.ts'
import { type CustomerAddress } from '../../features/account/types.ts'
import { useAuth } from '../../features/auth/AuthProvider.tsx'
import { supabase } from '../../lib/supabase.ts'

const empty = {
  label: '',
  recipient_name: '',
  phone: '',
  province: '',
  city: '',
  barangay: '',
  postal_code: '',
  address_line: '',
  is_default: false,
}

export function AccountAddressesPage() {
  const { user, profile } = useAuth()
  const [rows, setRows] = useState<CustomerAddress[]>([])
  const [form, setForm] = useState({ ...empty, recipient_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!supabase || !user) return
    const { data, error: queryError } = await supabase
      .from('customer_addresses')
      .select('id, label, recipient_name, phone, province, city, barangay, postal_code, address_line, is_default')
      .eq('customer_id', user.id)
      .order('is_default', { ascending: false })
    if (queryError) setError(queryError.message)
    else setRows((data ?? []) as CustomerAddress[])
  }

  useEffect(() => {
    void load()
  }, [user])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!supabase || !user) return
    const required = [form.recipient_name, form.phone, form.province, form.city, form.barangay, form.postal_code, form.address_line]
    if (required.some((value) => !value.trim())) {
      setError('Recipient, phone, and the full Philippine address are required.')
      return
    }
    setSaving(true)
    if (form.is_default || rows.length === 0) {
      await supabase.from('customer_addresses').update({ is_default: false }).eq('customer_id', user.id)
    }
    const { error: insertError } = await supabase.from('customer_addresses').insert({
      customer_id: user.id,
      label: form.label.trim() || null,
      recipient_name: form.recipient_name.trim(),
      phone: form.phone.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
      barangay: form.barangay.trim(),
      postal_code: form.postal_code.trim(),
      address_line: form.address_line.trim(),
      is_default: form.is_default || rows.length === 0,
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setForm({ ...empty, recipient_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
    await load()
  }

  const makeDefault = async (id: string) => {
    if (!supabase || !user) return
    await supabase.from('customer_addresses').update({ is_default: false }).eq('customer_id', user.id)
    const { error: updateError } = await supabase.from('customer_addresses').update({ is_default: true }).eq('id', id).eq('customer_id', user.id)
    if (updateError) setError(updateError.message)
    else await load()
  }

  const remove = async (id: string) => {
    if (!supabase || !user) return
    const { error: deleteError } = await supabase.from('customer_addresses').delete().eq('id', id).eq('customer_id', user.id)
    if (deleteError) setError(deleteError.message)
    else await load()
  }

  const field = (key: keyof typeof form, label: string) => (
    <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
      {label}
      <input
        className={`${rbpField} mt-2 h-11`}
        value={String(form[key])}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
      />
    </label>
  )

  return (
    <div>
      <GothicHeading as="h1" className="text-[3rem] leading-[0.9]">
        Addresses
      </GothicHeading>
      <p className="mt-3 text-sm text-white/75">Saved shipping addresses stay on this account. Origin for studio shipments remains Taguig.</p>
      {error && <p className="mt-4 text-sm text-[#ffb089]">{error}</p>}
      <div className="mt-6 space-y-3">
        {rows.length === 0 && <p className="text-sm text-white/70">No saved addresses yet.</p>}
        {rows.map((row) => (
          <article key={row.id} className={`p-4 ${rbpPanel}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-rbp-accent">{row.label || row.recipient_name}</p>
              {row.is_default && <span className="text-[11px] uppercase tracking-[0.16em] text-rbp-cream">Default</span>}
            </div>
            <p className="mt-2 text-sm text-white/80">
              {row.recipient_name} · {row.phone}
              <br />
              {row.address_line}, {row.barangay}, {row.city}, {row.province} {row.postal_code}
            </p>
            <div className="mt-3 flex gap-4 text-sm">
              {!row.is_default && (
                <button type="button" className="text-rbp-accent" onClick={() => void makeDefault(row.id)}>
                  Make default
                </button>
              )}
              <button type="button" className="text-white/70" onClick={() => void remove(row.id)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
      <form className="mt-8 grid max-w-xl gap-4" onSubmit={save}>
        <h2 className="text-sm uppercase tracking-[0.18em] text-rbp-cream">Add an address</h2>
        {field('label', 'Label')}
        {field('recipient_name', 'Recipient')}
        {field('phone', 'Phone')}
        {field('address_line', 'Street address')}
        {field('barangay', 'Barangay')}
        {field('city', 'City')}
        {field('province', 'Province')}
        {field('postal_code', 'Postal code')}
        <label className="flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => setForm((prev) => ({ ...prev, is_default: e.target.checked }))}
          />
          Use as the default shipping address
        </label>
        <OrangeButton type="submit" disabled={saving}>
          {saving ? 'Saving' : 'Save Address'}
        </OrangeButton>
      </form>
    </div>
  )
}
