import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { friendlyError } from '../../lib/friendlyError.ts'
import { PageTitle } from './ui.tsx'
import { formatPhp } from '../../lib/format.ts'
import { formatWhen, fulfillmentLabel, paymentLabel } from '../../lib/orderStatus.ts'
import { supabase } from '../../lib/supabase.ts'

type Row = {
  id: string
  order_number: string | null
  total_cents: number
  payment_status: string
  fulfillment_status: string
  created_at: string
  shipping_address: { fullName?: string; email?: string } | null
}

export function AdminOrdersPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [search, setSearch] = useState('')
  const [payment, setPayment] = useState('')
  const [fulfillment, setFulfillment] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let query = supabase
      .from('orders')
      .select('id, order_number, total_cents, payment_status, fulfillment_status, created_at, shipping_address')
      .order('created_at', { ascending: false })
    if (payment) query = query.eq('payment_status', payment)
    if (fulfillment) query = query.eq('fulfillment_status', fulfillment)
    let active = true
    query.then(({ data, error: queryError }) => {
      if (!active) return
      if (queryError) setError(queryError.message)
      else setRows((data ?? []) as Row[])
    })
    return () => {
      active = false
    }
  }, [payment, fulfillment])

  const needle = search.trim().toLowerCase()
  const visible = rows.filter((row) => {
    if (!needle) return true
    const name = row.shipping_address?.fullName?.toLowerCase() ?? ''
    const email = row.shipping_address?.email?.toLowerCase() ?? ''
    const number = row.order_number?.toLowerCase() ?? ''
    return name.includes(needle) || email.includes(needle) || number.includes(needle)
  })

  return (
    <div>
      <PageTitle title="Orders" subtitle="Review payment, fulfillment, and the LBC tracking number. A tracking number is recorded by hand and does not book a shipment." />
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          className="border border-rbp-border bg-black px-3 py-2 text-sm"
          placeholder="Search name, email, or order number"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="border border-rbp-border bg-black px-3 py-2 text-sm" value={payment} onChange={(event) => setPayment(event.target.value)}>
          <option value="">All payments</option>
          <option value="pending">Pending verification</option>
          <option value="proof_submitted">Proof submitted</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="border border-rbp-border bg-black px-3 py-2 text-sm" value={fulfillment} onChange={(event) => setFulfillment(event.target.value)}>
          <option value="">All fulfillment</option>
          <option value="unfulfilled">Unfulfilled</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {error && <p className="mt-4 text-sm text-[#ffb089]">{friendlyError(error)}</p>}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[0.16em] text-rbp-cream">
            <tr>
              <th className="py-2">Order</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Fulfillment</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="py-3">
                  <Link className="text-rbp-accent" to={`/admin/orders/${row.id}`}>
                    {row.order_number || row.id.slice(0, 8)}
                  </Link>
                  <div className="text-xs text-white/50">{formatWhen(row.created_at)}</div>
                </td>
                <td>{row.shipping_address?.fullName || 'Guest'}</td>
                <td>{paymentLabel(row.payment_status)}</td>
                <td>{fulfillmentLabel(row.fulfillment_status)}</td>
                <td>{formatPhp(row.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="mt-4 text-sm text-white/70">No orders match these filters.</p>}
      </div>
    </div>
  )
}
