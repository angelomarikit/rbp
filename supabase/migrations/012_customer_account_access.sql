-- 012 — Customer account access
-- Run after 005–011. Safe to re-run.
-- Customers can read their own profile and the same orders, items, and shipments.
-- A customer can create only their own profile, and only as role customer.
-- Admins keep the access already granted by is_admin() in earlier policies.

grant select, update on public.profiles to authenticated;
grant insert on public.profiles to authenticated;

grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.shipments to authenticated;
grant select on public.shipment_events to authenticated;
grant select on public.payment_proofs to authenticated;

drop policy if exists "Insert own customer profile" on public.profiles;
create policy "Insert own customer profile" on public.profiles
for insert with check (
  id = auth.uid()
  and role = 'customer'
);
