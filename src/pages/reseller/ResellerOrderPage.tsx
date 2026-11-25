import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { rbpPanel } from '../../components/ui/panels.ts'
import { ORDER_SELECT, type AccountOrder } from '../../features/account/types.ts'
import { useAuth } from '../../features/auth/AuthProvider.tsx'
import { formatPhp } from '../../lib/format.ts'
import { courierLabel, formatWhen, fulfillmentLabel, paymentLabel, shipmentNote } from '../../lib/orderStatus.ts'
import { paymentProofUrl, publicMediaUrl } from '../../lib/media.ts'
import { paymentMethodLabel } from '../../lib/paymentQr.ts'
import { supabase } from '../../lib/supabase.ts'

export function ResellerOrderPage() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState<AccountOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!supabase || !user || !orderId) return
    let active = true
    supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', orderId)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!active) return
        if (queryError) setError(queryError.message)
        else if (!data) setError('This order is not on your account.')
        else setOrder(data as AccountOrder)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [orderId, user])

  useEffect(() => {
    const proofs = order?.payment_proofs ?? []
    if (!proofs.length) return
    let active = true
    void Promise.all(proofs.map(async (proof) => [proof.id, await paymentProofUrl(proof.storage_path)] as const)).then((pairs) => {
      if (active) setProofUrls(Object.fromEntries(pairs))
    })
    return () => {
      active = false
    }
  }, [order])

  if (loading) return <LoadingScreen label="Loading order" />
  if (error || !order) return <p className="text-sm text-[#ffb089]">{friendlyError(error, 'This order is not on your account.')}</p>

  const address = order.shipping_address
  const shipment = [...(order.shipments ?? [])].sort((a, b) => (a.id < b.id ? -1 : 1))[0]
  const events = [...(shipment?.shipment_events ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at))

  return (
    <div>
      <Link to="/reseller/orders" className="text-sm text-rbp-accent">
        All orders
      </Link>
      <GothicHeading as="h1" className="mt-3 text-[2.6rem] leading-[0.9]">
        {order.order_number || 'Order'}
      </GothicHeading>
      <p className="mt-3 text-sm text-white/70">{formatWhen(order.created_at)}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className={`p-4 ${rbpPanel}`}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Payment</p>
          <p className="mt-2 text-white">{paymentLabel(order.payment_status)}</p>
          <p className="mt-1 text-sm text-white/70">{paymentMethodLabel(order.payment_method)}</p>
        </div>
        <div className={`p-4 ${rbpPanel}`}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Fulfillment</p>
          <p className="mt-2 text-white">{fulfillmentLabel(order.fulfillment_status)}</p>
        </div>
      </div>
      <div className={`mt-4 p-4 ${rbpPanel}`}>
        <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Items</p>
        <ul className="mt-3 space-y-2 text-sm">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3">
                {item.image_path ? <img src={publicMediaUrl(item.image_path)} alt="" className="h-14 w-14 shrink-0 rounded object-cover" /> : null}
                <span>
                  {item.product_name} × {item.quantity}
                </span>
              </span>
              <span>{formatPhp(item.unit_price_cents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-rbp-border pt-3 text-sm">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPhp(order.subtotal_cents)}</span>
          </p>
          <p className="flex justify-between">
            <span>Shipping</span>
            <span>{formatPhp(order.shipping_cents)}</span>
          </p>
          <p className="flex justify-between text-rbp-accent">
            <span>Total</span>
            <span>{formatPhp(order.total_cents)}</span>
          </p>
        </div>
      </div>
      {(order.payment_proofs ?? []).length > 0 && (
        <div className={`mt-4 p-4 ${rbpPanel}`}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Payment screenshot</p>
          <ul className="mt-3 space-y-3">
            {order.payment_proofs?.map((proof) => (
              <li key={proof.id}>
                <p className="text-sm text-white">Reference ending {proof.note || '—'}</p>
                {proofUrls[proof.id] && (
                  <img src={proofUrls[proof.id]} alt="Payment screenshot" className="mt-2 max-h-64 rounded-md border border-rbp-border object-contain" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {address && (
        <div className={`mt-4 p-4 ${rbpPanel}`}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Ship to</p>
          <p className="mt-2 text-sm text-white/80">
            {address.fullName} · {address.phone}
            <br />
            {address.address}, {address.barangay}, {address.city}, {address.province} {address.postalCode}
          </p>
        </div>
      )}
      <div className={`mt-4 p-4 ${rbpPanel}`}>
        <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">LBC shipment</p>
        {!shipment && <p className="mt-2 text-sm text-white/70">No shipment record is attached to this order yet.</p>}
        {shipment && (
          <>
            <p className="mt-2 text-sm text-white">
              {courierLabel(shipment.courier)} from {shipment.origin_city}
              {shipment.destination_summary ? ` to ${shipment.destination_summary}` : ''}
            </p>
            <p className="mt-2 text-sm text-white/80">
              Tracking number: {shipment.tracking_number || 'Waiting for the studio to enter one'}
            </p>
            <p className="mt-1 text-sm text-white/70">Status: {fulfillmentLabel(shipment.status)}</p>
            <ol className="mt-4 space-y-3 border-l border-rbp-border pl-4">
              {events.map((event) => (
                <li key={event.id}>
                  <p className="text-sm text-white">{fulfillmentLabel(event.status)}</p>
                  <p className="text-xs text-white/60">{formatWhen(event.created_at)}</p>
                  {event.note && <p className="text-sm text-white/75">{shipmentNote(event.note)}</p>}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  )
}