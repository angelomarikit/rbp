-- 018 — Admin delete that runs with the database owner, so the order and its items actually go away.
grant delete on public.orders to authenticated;

drop policy if exists "Admin delete orders" on public.orders;
create policy "Admin delete orders" on public.orders
for delete using (public.is_admin());

create or replace function public.admin_delete_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'You do not have permission to do that';
  end if;
  delete from public.orders where id = p_order_id;
  if not found then
    raise exception 'Order not found';
  end if;
end;
$$;

revoke all on function public.admin_delete_order(uuid) from public;
grant execute on function public.admin_delete_order(uuid) to authenticated;
