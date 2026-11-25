-- Admin: remove reseller record and optionally revert profile role to customer.

grant delete on public.resellers to authenticated;

create or replace function public.admin_delete_reseller(
  p_reseller_id uuid,
  p_revert_profile_to_customer boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  delete from public.resellers
  where id = p_reseller_id
  returning profile_id into v_profile_id;

  if not found then
    raise exception 'Reseller not found';
  end if;

  if p_revert_profile_to_customer and v_profile_id is not null then
    update public.profiles
    set role = 'customer', updated_at = now()
    where id = v_profile_id
      and role = 'reseller';
  end if;
end;
$$;

revoke all on function public.admin_delete_reseller(uuid, boolean) from public;
grant execute on function public.admin_delete_reseller(uuid, boolean) to authenticated;