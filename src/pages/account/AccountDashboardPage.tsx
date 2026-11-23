import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { rbpPanel } from '../../components/ui/panels.ts'
import { ORDER_SELECT, type AccountOrder } from '../../features/account/types.ts'
import { useAuth } from '../../features/auth/AuthProvider.tsx'
import { formatPhp } from '../../lib/format.ts'
import { formatWhen, fulfillmentLabel, paymentLabel } from '../../lib/orderStatus.ts'
import { supabase } from '../../lib/supabase.ts'

export function AccountDashboardPage() {
  const { user, profile } = useAuth()
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [orderCount, setOrderCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase || !user) return
    let active = true
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', user.id)
      .then(({ count, error: countError }) => {
        if (!active || countError) return
        setOrderCount(count ?? 0)
      })
    supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
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
      <p className="text-[12px] uppercase tracking-[0.28em] text-rbp-cream">Customer</p>
      <GothicHeading as="h1" className="mt-2 text-[3rem] leading-[0.9]">
        {profile?.full_name || 'Your dashboard'}
      </GothicHeading>
      <p className="mt-3 max-w-xl text-sm text-white/75">
        Orders placed while you are signed in use this account. Payment and LBC updates from the studio appear on the same order.
      </p>
      {error && <p className="mt-4 text-sm text-[#ffb089]">{friendlyError(error)}</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className={`p-4 ${rbpPanel}`}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Recent orders</p>
          <p className="mt-2 text-2xl text-rbp-accent">{orderCount}</p>
        </div>
        <div className={`p-4 ${rbpPanel}`}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Phone</p>
          <p className="mt-2 text-sm text-white">{profile?.phone || 'Add a phone number'}</p>
        </div>
        <div className={`p-4 ${rbpPanel}`}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Email</p>
          <p className="mt-2 break-all text-sm text-white">{profile?.email}</p>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-sm uppercase tracking-[0.18em] text-rbp-cream">Latest orders</h2>
        <div className="mt-3 space-y-3">
          {orders.length === 0 && <p className="text-sm text-white/70">No orders are linked to this account yet.</p>}
          {orders.map((order) => (
            <Link key={order.id} to={`/account/orders/${order.id}`} className={`block p-4 ${rbpPanel}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-rbp-accent">{order.order_number || order.id.slice(0, 8)}</span>
                <span className="text-sm text-white">{formatPhp(order.total_cents)}</span>
              </div>
              <p className="mt-2 text-sm text-white/75">
                {formatWhen(order.created_at)} · {paymentLabel(order.payment_status)} · {fulfillmentLabel(order.fulfillment_status)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
