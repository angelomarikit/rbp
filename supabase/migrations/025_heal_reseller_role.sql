-- Repair profiles stuck as customer after a reseller application was saved.

create or replace function public.heal_reseller_profile_role()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_healed boolean := false;
begin
  if auth.uid() is null then
    return false;
  end if;

  if exists (
    select 1
    from public.resellers r
    join public.profiles p on p.id = r.profile_id
    where r.profile_id = auth.uid()
      and p.role = 'customer'
  ) then
    perform set_config('rbp.reseller_registration', '1', true);
    update public.profiles
    set role = 'reseller', updated_at = now()
    where id = auth.uid();
    perform set_config('rbp.reseller_registration', '', true);
    v_healed := true;
  end if;

  return v_healed;
end;
$$;

revoke all on function public.heal_reseller_profile_role() from public;
grant execute on function public.heal_reseller_profile_role() to authenticated;

update public.profiles p
set role = 'reseller', updated_at = now()
from public.resellers r
where r.profile_id = p.id
  and p.role = 'customer';