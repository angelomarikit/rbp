import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { OrangeButton } from '../../components/ui/Buttons.tsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { SuccessModal } from '../../components/ui/SuccessModal.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { PageTitle } from './ui.tsx'
import { rbpPanel } from '../../components/ui/panels.ts'
import { ORDER_SELECT, type AccountOrder } from '../../features/account/types.ts'
import { formatPhp } from '../../lib/format.ts'
import { courierLabel, formatWhen, fulfillmentLabel, shipmentNote } from '../../lib/orderStatus.ts'
import { paymentProofUrl, publicMediaUrl, uploadPaymentProof } from '../../lib/media.ts'
import { supabase } from '../../lib/supabase.ts'

export function AdminOrderPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<AccountOrder | null>(null)
  const [payment, setPayment] = useState('pending')
  const [fulfillment, setFulfillment] = useState('unfulfilled')
  const [tracking, setTracking] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [askDelete, setAskDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [referenceLast4, setReferenceLast4] = useState('')
  const [proofSaving, setProofSaving] = useState(false)
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({})

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
      courier: 'lbc',
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

  const remove = async () => {
    if (!supabase || !order || deleting) return
    setDeleting(true)
    setDeleteError(null)
    const finished = (message: string | null) => {
      setDeleting(false)
      if (message) setDeleteError(message)
      else navigate('/admin/orders', { replace: true })
    }
    const rpc = await supabase.rpc('admin_delete_order', { p_order_id: order.id })
    const missingRpc = rpc.error && /could not find|does not exist|schema cache|PGRST202/i.test(rpc.error.message)
    if (!rpc.error) {
      finished(null)
      return
    }
    if (!missingRpc) {
      finished(friendlyError(rpc.error, 'The order could not be deleted.'))
      return
    }
    const direct = await supabase.from('orders').delete().eq('id', order.id).select('id')
    if (direct.error) {
      finished(friendlyError(direct.error, 'The order could not be deleted.'))
      return
    }
    if (!direct.data?.length) {
      finished('This order is still here. Run supabase/migrations/018_admin_delete_order.sql in Supabase, then try again.')
      return
    }
    finished(null)
  }

  const uploadProof = async () => {
    if (!supabase || !order || !proofFile) return
    const digits = referenceLast4.trim()
    if (!/^\d{4}$/.test(digits)) {
      setError('Enter the last 4 digits of the reference number.')
      return
    }
    setProofSaving(true)
    setError(null)
    try {
      const path = await uploadPaymentProof(proofFile, order.id)
      const { error: proofError } = await supabase.rpc('attach_payment_proof', {
        p_order_id: order.id,
        p_storage_path: path,
        p_reference_last4: digits,
      })
      if (proofError) throw proofError
      setProofFile(null)
      setReferenceLast4('')
      await load()
    } catch (uploadError) {
      setError(friendlyError(uploadError, 'The payment screenshot was not saved. Run the payment proof migration, then try again.'))
    } finally {
      setProofSaving(false)
    }
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
      {askDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-order-title">
          <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#161616] px-6 py-7 text-center shadow-2xl">
            <h2 id="delete-order-title" className="text-lg font-semibold text-white">Are you sure you want to delete?</h2>
            <p className="mt-2 text-sm leading-6 text-[#c8c8c8]">
              {order.order_number || 'This order'} will be removed, including its items and shipment. This cannot be undone.
            </p>
            {deleteError && <p className="mt-3 text-sm text-[#ffb089]">{deleteError}</p>}
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={(event) => {
                  event.preventDefault()
                  void remove()
                }}
                className="rounded-lg bg-[#FF7900] px-5 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete order'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={(event) => {
                  event.preventDefault()
                  setAskDelete(false)
                  setDeleteError(null)
                }}
                className="rounded-lg border border-[#3a3a3a] px-5 py-2 text-sm text-white disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
          LBC tracking number
          <input className="mt-2 block w-full border border-rbp-border bg-black px-3 py-2 text-sm normal-case tracking-normal" value={tracking} onChange={(event) => setTracking(event.target.value)} />
        </label>
        <p className="text-sm text-white/70">
          Saving a tracking number records it on the LBC shipment from Taguig. It does not book the parcel with LBC.
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
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3">
                {item.image_path ? <img src={publicMediaUrl(item.image_path)} alt="" className="h-14 w-14 shrink-0 rounded object-cover" /> : null}
                <span>{item.product_name} × {item.quantity}</span>
              </span>
              <span>{formatPhp(item.unit_price_cents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-rbp-accent">Total {formatPhp(order.total_cents)}</p>
      </div>
      <div className={`mt-4 p-4 ${rbpPanel}`}>
        <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Payment screenshot</p>
        <p className="mt-2 text-sm text-white/70">The screenshot and last 4 digits the client sent for this order.</p>
        <ul className="mt-3 space-y-3">
          {(order.payment_proofs ?? []).map((proof) => (
            <li key={proof.id} className="text-sm">
              <p className="text-white">Reference ending {proof.note || '—'}</p>
              {proofUrls[proof.id] ? (
                <a href={proofUrls[proof.id]} target="_blank" rel="noreferrer">
                  <img src={proofUrls[proof.id]} alt="Client payment screenshot" className="mt-2 max-h-64 rounded-md border border-rbp-border object-contain" />
                </a>
              ) : (
                <p className="mt-1 text-white/50">Screenshot saved. It will show after the payment proof migration is applied.</p>
              )}
            </li>
          ))}
        </ul>
        <label className="mt-4 block text-xs uppercase tracking-[0.16em] text-rbp-cream">
          Upload the client screenshot
          <input
            className="mt-2 block w-full text-sm normal-case tracking-normal"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="mt-3 block text-xs uppercase tracking-[0.16em] text-rbp-cream">
          Last 4 digits
          <input
            className="mt-2 block w-full border border-rbp-border bg-black px-3 py-2 text-sm normal-case tracking-normal"
            inputMode="numeric"
            maxLength={4}
            value={referenceLast4}
            placeholder="1234"
            onChange={(event) => setReferenceLast4(event.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </label>
        <button
          type="button"
          disabled={proofSaving || !proofFile}
          onClick={() => void uploadProof()}
          className="mt-3 rounded-md bg-[#FF7900] px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {proofSaving ? 'Uploading' : 'Save payment screenshot'}
        </button>
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
              {event.note && <p className="text-sm text-white/75">{shipmentNote(event.note)}</p>}
            </li>
          ))}
        </ol>
      </div>
      <div className={`mt-4 p-4 ${rbpPanel}`}>
        <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Delete order</p>
        <p className="mt-2 text-sm text-white/70">
          Removes {order.order_number || 'this order'}, its items, and its shipment record. The customer will no longer see it.
        </p>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setDeleteError(null)
            setAskDelete(true)
          }}
          className="mt-3 rounded-md border border-[#ffb089] px-3 py-2 text-sm text-[#ffb089]"
        >
          Delete order
        </button>
      </div>
    </div>
  )
}
