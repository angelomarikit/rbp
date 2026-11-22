import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { rbpPanel } from '../../components/ui/panels.ts'
import { ORDER_SELECT, type AccountOrder } from '../../features/account/types.ts'
import { useAuth } from '../../features/auth/AuthProvider.tsx'
import { formatPhp } from '../../lib/format.ts'
import { courierLabel, formatWhen, fulfillmentLabel, paymentLabel } from '../../lib/orderStatus.ts'
import { supabase } from '../../lib/supabase.ts'

export function AccountOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase || !user) return
    let active = true
    supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return
        if (queryError) setError(queryError.message)
        else setOrders((data ?? []) as AccountOrder[])
      })
    return () => {
      active = false
    }
  }, [user])

  return (
    <div>
      <GothicHeading as="h1" className="text-[3rem] leading-[0.9]">
        Orders
      </GothicHeading>
      <p className="mt-3 text-sm text-white/75">These are the studio order records for this account, including payment and shipment status.</p>
      {error && <p className="mt-4 text-sm text-[#ffb089]">{friendlyError(error)}</p>}
      <div className="mt-6 space-y-3">
        {orders.length === 0 && <p className="text-sm text-white/70">No orders are linked to this account yet.</p>}
        {orders.map((order) => {
          const shipment = order.shipments?.[0]
          return (
            <Link key={order.id} to={`/account/orders/${order.id}`} className={`block p-4 ${rbpPanel}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-rbp-accent">{order.order_number || order.id.slice(0, 8)}</span>
                <span>{formatPhp(order.total_cents)}</span>
              </div>
              <p className="mt-2 text-sm text-white/75">
                {formatWhen(order.created_at)} · {paymentLabel(order.payment_status)} · {fulfillmentLabel(order.fulfillment_status)}
              </p>
              {shipment && (
                <p className="mt-1 text-sm text-white/75">
                  {courierLabel(shipment.courier)}
                  {shipment.tracking_number ? ` · ${shipment.tracking_number}` : ' · Tracking number pending'}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
