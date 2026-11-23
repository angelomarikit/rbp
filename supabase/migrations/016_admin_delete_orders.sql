-- 016 — Let an admin delete an order. Items, proofs, and shipments cascade.
grant delete on public.orders to authenticated;

drop policy if exists "Admin delete orders" on public.orders;
create policy "Admin delete orders" on public.orders
for delete using (public.is_admin());
