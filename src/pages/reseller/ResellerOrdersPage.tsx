import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GothicHeading } from '../../components/ui/GothicHeading.tsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { ORDER_SELECT, type AccountOrder } from '../../features/account/types.ts'
import { useAuth } from '../../features/auth/AuthProvider.tsx'
import { formatPhp } from '../../lib/format.ts'
import { friendlyError } from '../../lib/friendlyError.ts'
import { paymentLabel, formatWhen } from '../../lib/orderStatus.ts'
import { rbpPanel } from '../../components/ui/panels.ts'
import { supabase } from '../../lib/supabase.ts'

type Tab = 'sales' | 'purchases'

export function ResellerOrdersPage() {
  const { user, reseller } = useAuth()
  const [tab, setTab] = useState<Tab>('sales')
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase || !user) return
    let active = true
    setLoading(true)
    const query =
      tab === 'sales' && reseller?.id
        ? supabase.from('orders').select(ORDER_SELECT).eq('reseller_id', reseller.id).order('created_at', { ascending: false })
        : supabase.from('orders').select(ORDER_SELECT).eq('customer_id', user.id).order('created_at', { ascending: false })

    void query.then(({ data, error: queryError }) => {
      if (!active) return
      if (queryError) setError(queryError.message)
      else setOrders((data ?? []) as AccountOrder[])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [tab, user, reseller?.id])

  return (
    <div>
      <GothicHeading as="h1" className="text-[3rem] leading-[0.9]">
        Orders
      </GothicHeading>
      <div className="mt-6 flex gap-2">
        {(
          [
            ['sales', 'Sales via my code'],
            ['purchases', 'My purchases'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`px-4 py-2 text-[12px] uppercase tracking-[0.14em] ${
              tab === id ? 'bg-rbp-accent text-black' : 'border border-rbp-border text-white hover:text-rbp-accent'
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {loading ? <LoadingScreen label="Loading orders" /> : null}
      {error && <p className="mt-4 text-sm text-[#ffb089]">{friendlyError(error)}</p>}
      {!loading && orders.length === 0 && (
        <p className="mt-8 text-sm text-rbp-cream">No orders in this list yet.</p>
      )}
      <div className="mt-6 space-y-3">
        {orders.map((order) => (
          <Link key={order.id} to={`/wholesaler/orders/${order.id}`} className={`block p-4 ${rbpPanel}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-white">{order.order_number || order.id.slice(0, 8)}</p>
              <p className="text-xs text-rbp-cream">{formatWhen(order.created_at)}</p>
            </div>
            <p className="mt-1 text-sm text-rbp-accent">{formatPhp(order.total_cents)}</p>
            <p className="mt-1 text-[12px] text-white/70">
              Payment: {paymentLabel(order.payment_status)} · {order.order_items.length} item
              {order.order_items.length === 1 ? '' : 's'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}