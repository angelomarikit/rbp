import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoadingScreen } from '../../components/ui/LoadingScreen.tsx'
import { friendlyError } from '../../lib/friendlyError.ts'
import { PageTitle } from './ui.tsx'
import { formatPhp } from '../../lib/format.ts'
import { formatWhen, fulfillmentLabel, paymentLabel } from '../../lib/orderStatus.ts'
import { supabase } from '../../lib/supabase.ts'

type DashItem = { product_name: string; quantity: number; unit_price_cents: number }

type DashOrder = {
  id: string
  order_number: string | null
  total_cents: number
  payment_status: string
  fulfillment_status: string
  created_at: string
  shipping_address: { fullName?: string } | null
  order_items: DashItem[]
}

function dateInput(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function parseInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function dayKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return dateInput(date)
}

export function AdminDashboardPage() {
  const today = useMemo(() => new Date(), [])
  const [from, setFrom] = useState(() => dateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)))
  const [to, setTo] = useState(() => dateInput(today))
  const [orders, setOrders] = useState<DashOrder[]>([])
  const [unfulfilled, setUnfulfilled] = useState(0)
  const [pendingPayment, setPendingPayment] = useState(0)
  const [customers, setCustomers] = useState(0)
  const [inquiries, setInquiries] = useState(0)
  const [lowStock, setLowStock] = useState<{ name: string; sku: string | null; inventory_qty: number }[]>([])
  const [threshold, setThreshold] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    let active = true
    const client = supabase
    const fromDate = parseInput(from)
    const toDate = parseInput(to)
    toDate.setHours(23, 59, 59, 999)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
    const fetchStart = fromDate < monthStart ? fromDate : monthStart
    const fetchEnd = toDate > endOfToday ? toDate : endOfToday

    setLoading(true)
    setError(null)

    Promise.all([
      client
        .from('orders')
        .select('id, order_number, total_cents, payment_status, fulfillment_status, created_at, shipping_address, order_items(product_name, quantity, unit_price_cents)')
        .gte('created_at', fetchStart.toISOString())
        .lte('created_at', fetchEnd.toISOString())
        .order('created_at', { ascending: false }),
      client.from('orders').select('id', { count: 'exact', head: true }).eq('fulfillment_status', 'unfulfilled'),
      client.from('orders').select('id', { count: 'exact', head: true }).in('payment_status', ['pending', 'proof_submitted']),
      client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      client.from('inquiries').select('id', { count: 'exact', head: true }),
      client.from('site_settings').select('low_stock_threshold').eq('id', 1).maybeSingle(),
    ]).then(async ([orderResult, unfulfilledResult, paymentResult, customerResult, inquiryResult, settingsResult]) => {
      if (!active) return
      const failure = orderResult.error || unfulfilledResult.error || paymentResult.error || customerResult.error || inquiryResult.error || settingsResult.error
      if (failure) {
        setError(failure.message)
        setLoading(false)
        return
      }
      const limit = settingsResult.data?.low_stock_threshold ?? 5
      const stockResult = await client
        .from('products')
        .select('name, sku, inventory_qty')
        .not('inventory_qty', 'is', null)
        .lte('inventory_qty', limit)
        .neq('status', 'archived')
        .order('inventory_qty', { ascending: true })
        .limit(8)
      if (!active) return
      if (stockResult.error) {
        setError(stockResult.error.message)
        setLoading(false)
        return
      }
      setOrders((orderResult.data ?? []) as DashOrder[])
      setUnfulfilled(unfulfilledResult.count ?? 0)
      setPendingPayment(paymentResult.count ?? 0)
      setCustomers(customerResult.count ?? 0)
      setInquiries(inquiryResult.count ?? 0)
      setThreshold(limit)
      setLowStock((stockResult.data ?? []) as { name: string; sku: string | null; inventory_qty: number }[])
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [from, to, today])

  const rangeStart = parseInput(from).getTime()
  const rangeEnd = parseInput(to)
  rangeEnd.setHours(23, 59, 59, 999)
  const inRange = orders.filter((order) => {
    const time = new Date(order.created_at).getTime()
    return time >= rangeStart && time <= rangeEnd.getTime()
  })
  const countable = (order: DashOrder) => order.fulfillment_status !== 'cancelled'
  const sales = inRange.filter(countable).reduce((sum, order) => sum + order.total_cents, 0)
  const todayKey = dateInput(today)
  const monthKey = todayKey.slice(0, 7)
  const daily = orders.filter((order) => countable(order) && dayKey(order.created_at) === todayKey).reduce((sum, order) => sum + order.total_cents, 0)
  const monthly = orders.filter((order) => countable(order) && dayKey(order.created_at).startsWith(monthKey)).reduce((sum, order) => sum + order.total_cents, 0)

  const bars = useMemo(() => {
    const start = parseInput(from)
    const end = parseInput(to)
    const days: { key: string; total: number }[] = []
    const cursor = new Date(start)
    while (cursor <= end && days.length < 62) {
      days.push({ key: dateInput(cursor), total: 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
    const totals = new Map(days.map((day) => [day.key, day]))
    for (const order of inRange) {
      if (!countable(order)) continue
      const bucket = totals.get(dayKey(order.created_at))
      if (bucket) bucket.total += order.total_cents
    }
    const peak = Math.max(...days.map((day) => day.total), 1)
    return days.map((day) => ({ ...day, height: Math.round((day.total / peak) * 100) }))
  }, [from, to, orders])

  const topProducts = useMemo(() => {
    const map = new Map<string, { quantity: number; cents: number }>()
    for (const order of inRange) {
      if (!countable(order)) continue
      for (const item of order.order_items ?? []) {
        const current = map.get(item.product_name) ?? { quantity: 0, cents: 0 }
        current.quantity += item.quantity
        current.cents += item.quantity * item.unit_price_cents
        map.set(item.product_name, current)
      }
    }
    return [...map.entries()].sort((a, b) => b[1].cents - a[1].cents).slice(0, 5)
  }, [orders, from, to])

  return (
    <div>
      <PageTitle title="Home" subtitle="Sales, orders, and inquiries for the selected dates." />
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-xs uppercase tracking-[0.16em] text-rbp-cream">
          From
          <input className="mt-2 block border border-rbp-border bg-black px-3 py-2 text-sm text-white" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="text-xs uppercase tracking-[0.16em] text-rbp-cream">
          To
          <input className="mt-2 block border border-rbp-border bg-black px-3 py-2 text-sm text-white" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
      </div>
      {error && <p className="mt-4 text-sm text-[#ffb089]">{friendlyError(error)}</p>}
      {loading && <LoadingScreen label="Loading store numbers" />}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Sales in range" value={formatPhp(sales)} />
        <Stat label="Today" value={formatPhp(daily)} />
        <Stat label="This month" value={formatPhp(monthly)} />
        <Stat label="Orders in range" value={String(inRange.length)} />
        <Stat label="Unfulfilled" value={String(unfulfilled)} />
        <Stat label="Payment to verify" value={String(pendingPayment)} />
        <Stat label="Customers" value={String(customers)} />
        <Stat label="Inquiries" value={String(inquiries)} />
      </div>
      <div className="mt-6 rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Revenue</p>
        <div className="mt-4 flex h-40 items-end gap-1">
          {bars.map((bar) => (
            <div key={bar.key} className="group flex h-full flex-1 items-end" title={`${bar.key} ${formatPhp(bar.total)}`}>
              <div className="w-full bg-rbp-accent" style={{ height: `${Math.max(bar.height, bar.total > 0 ? 4 : 0)}%` }} />
            </div>
          ))}
        </div>
        {sales === 0 && <p className="mt-3 text-sm text-white/70">No order totals fall in this range. Cancelled orders stay out of the sales figure.</p>}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Recent orders</p>
          <div className="mt-3 space-y-3">
            {inRange.slice(0, 6).length === 0 && <p className="text-sm text-white/70">No orders in this range.</p>}
            {inRange.slice(0, 6).map((order) => (
              <Link key={order.id} to={`/admin/orders/${order.id}`} className="block border-b border-white/10 pb-3">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-rbp-accent">{order.order_number || order.id.slice(0, 8)}</span>
                  <span>{formatPhp(order.total_cents)}</span>
                </div>
                <p className="mt-1 text-xs text-white/70">
                  {order.shipping_address?.fullName || 'Guest'} · {formatWhen(order.created_at)} · {paymentLabel(order.payment_status)} · {fulfillmentLabel(order.fulfillment_status)}
                </p>
              </Link>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Top products</p>
          <div className="mt-3 space-y-3">
            {topProducts.length === 0 && <p className="text-sm text-white/70">No product sales in this range.</p>}
            {topProducts.map(([name, stats]) => (
              <div key={name} className="flex justify-between gap-3 border-b border-white/10 pb-3 text-sm">
                <span>{name}</span>
                <span className="text-right text-white/80">
                  {stats.quantity} sold
                  <br />
                  {formatPhp(stats.cents)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-rbp-cream">Low stock · at or below {threshold}</p>
          <div className="mt-3 space-y-2 text-sm">
            {lowStock.length === 0 && <p className="text-white/70">No tracked products are at the low-stock line.</p>}
            {lowStock.map((product) => (
              <p key={product.name} className="flex justify-between gap-3">
                <span>{product.name}</span>
                <span className="text-rbp-accent">{product.inventory_qty}</span>
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-rbp-cream">{label}</p>
      <p className="mt-2 text-2xl text-rbp-accent">{value}</p>
    </div>
  )
}
