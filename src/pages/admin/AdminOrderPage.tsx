import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { OrangeButton } from '../../components/ui/Buttons.tsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { SuccessModal } from '../../components/ui/SuccessModal.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { PageTitle } from './ui.tsx'
import { rbpPanel } from '../../components/ui/panels.ts'
import { ORDER_SELECT, type AccountOrder } from '../../features/account/types.ts'
import { formatPhp } from '../../lib/format.ts'
import { courierLabel, formatWhen, fulfillmentLabel } from '../../lib/orderStatus.ts'
import { supabase } from '../../lib/supabase.ts'

export function AdminOrderPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState<AccountOrder | null>(null)
  const [payment, setPayment] = useState('pending')
  const [fulfillment, setFulfillment] = useState('unfulfilled')
  const [tracking, setTracking] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!supabase || !orderId) return
    const { data, error: queryError } = await supabase.from('orders').select(ORDER_SELECT).eq('id', orderId).maybeSingle()
    if (queryError) {
      setError(queryError.message)
      return
    }
    const next = data as AccountOrder | null
    setOrder(next)
    if (next) {
      setPayment(next.payment_status)
      setFulfillment(next.fulfillment_status)
      setTracking(next.shipments?.[0]?.tracking_number ?? '')
    }
  }

  useEffect(() => {
    void load()
  }, [orderId])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase || !order) return
    setSaving(true)
    setError(null)
    setNotice(null)
    const { error: orderError } = await supabase
      .from('orders')
      .update({ payment_status: payment, fulfillment_status: fulfillment })
      .eq('id', order.id)
    if (orderError) {
      setSaving(false)
      setError(orderError.message)
      return
    }
    const shipment = order.shipments?.[0]
    const shipmentPayload = {
      status: fulfillment,
      tracking_number: tracking.trim() || null,
      courier: 'jnt',
      origin_city: 'Taguig',
    }
    const shipmentResult = shipment
      ? await supabase.from('shipments').update(shipmentPayload).eq('id', shipment.id)
      : await supabase.from('shipments').insert({
          ...shipmentPayload,
          order_id: order.id,
          destination_summary: [order.shipping_address?.city, order.shipping_address?.province].filter(Boolean).join(', '),
        })
    if (shipmentResult.error) {
      setSaving(false)
      setError(shipmentResult.error.message)
      return
    }
    setSaving(false)
    setNotice('Order updated. The customer account reads this same order and shipment.')
    await load()
  }

  if (!order) {
    return error ? <p className="text-sm text-[#ffb089]">{friendlyError(error)}</p> : <LoadingScreen label="Loading order" />
  }

  const shipment = order.shipments?.[0]
  const events = [...(shipment?.shipment_events ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const address = order.shipping_address

  return (
    <div className="max-w-3xl">
      <Link to="/admin/orders" className="text-sm text-rbp-accent">
        All orders
      </Link>
      <PageTitle title={order.order_number || 'Order'} />
      <p className="mt-2 text-sm text-white/70">{formatWhen(order.created_at)}</p>
      {error && <p className="mt-4 text-sm text-[#ffb089]">{friendlyError(error)}</p>}
      {notice ? <SuccessModal message="The order was saved." onClose={() => setNotice(null)} /> : null}
      {saving ? <LoadingScreen label="Saving" full /> : null}
      <form className={`mt-6 space-y-4 p-4 ${rbpPanel}`} onSubmit={save}>
        <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
          Payment
          <select className="mt-2 block w-full border border-rbp-border bg-black px-3 py-2 text-sm normal-case tracking-normal text-white" value={payment} onChange={(event) => setPayment(event.target.value)}>
            <option value="pending">Pending verification</option>
            <option value="proof_submitted">Proof submitted</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
          Fulfillment
          <select className="mt-2 block w-full border border-rbp-border bg-black px-3 py-2 text-sm normal-case tracking-normal text-white" value={fulfillment} onChange={(event) => setFulfillment(event.target.value)}>
            <option value="unfulfilled">Unfulfilled</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="block text-xs uppercase tracking-[0.16em] text-rbp-cream">
          J&T tracking number
          <input className="mt-2 block w-full border border-rbp-border bg-black px-3 py-2 text-sm normal-case tracking-normal" value={tracking} onChange={(event) => setTracking(event.target.value)} />
        </label>
        <p className="text-sm text-white/70">
          Saving a tracking number records it on the J&T shipment from Taguig. It does not book the parcel with J&T.
        </p>
        <OrangeButton type="submit" disabled={saving}>
          {saving ? 'Saving' : 'Save order'}
        </OrangeButton>
      </form>
      <div className={`mt-4 p-4 ${rbpPanel}`}>
        <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Customer</p>
        {address && (
          <p className="mt-2 text-sm text-white/80">
            {address.fullName} · {address.email} · {address.phone}
            <br />
            {address.address}, {address.barangay}, {address.city}, {address.province} {address.postalCode}
          </p>
        )}
        <ul className="mt-4 space-y-2 text-sm">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span>{formatPhp(item.unit_price_cents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-rbp-accent">Total {formatPhp(order.total_cents)}</p>
      </div>
      <div className={`mt-4 p-4 ${rbpPanel}`}>
        <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Shipment history</p>
        {shipment && (
          <p className="mt-2 text-sm text-white/80">
            {courierLabel(shipment.courier)} from {shipment.origin_city}
            {shipment.tracking_number ? ` · ${shipment.tracking_number}` : ''}
          </p>
        )}
        <ol className="mt-3 space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <p className="text-sm">{fulfillmentLabel(event.status)}</p>
              <p className="text-xs text-white/50">{formatWhen(event.created_at)}</p>
              {event.note && <p className="text-sm text-white/75">{event.note}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
