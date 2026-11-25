-- Fix reseller applications not saving (profile role trigger) and admin list/approve access.

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and new.role is distinct from old.role
     and not public.is_admin() then
    if new.role = 'reseller'
       and old.role = 'customer'
       and current_setting('rbp.reseller_registration', true) = '1' then
      return new;
    end if;
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end;
$$;

create or replace function public.register_reseller_profile(
  p_province text,
  p_city text,
  p_barangay text,
  p_postal_code text,
  p_address_line text,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;
  if exists (select 1 from public.resellers where profile_id = auth.uid()) then
    raise exception 'A reseller application already exists for this account';
  end if;

  perform set_config('rbp.reseller_registration', '1', true);

  update public.profiles
  set role = 'reseller',
      phone = coalesce(nullif(trim(p_phone), ''), phone),
      updated_at = now()
  where id = auth.uid();

  insert into public.resellers (
    profile_id,
    status,
    province,
    city,
    barangay,
    postal_code,
    address_line
  )
  values (
    auth.uid(),
    'pending',
    trim(coalesce(p_province, '')),
    trim(coalesce(p_city, '')),
    trim(coalesce(p_barangay, '')),
    trim(coalesce(p_postal_code, '')),
    trim(coalesce(p_address_line, ''))
  )
  returning id into v_id;

  perform set_config('rbp.reseller_registration', '', true);
  return v_id;
exception
  when others then
    perform set_config('rbp.reseller_registration', '', true);
    raise;
end;
$$;

grant select, update on public.resellers to authenticated;

create or replace function public.admin_list_resellers()
returns table (
  id uuid,
  profile_id uuid,
  status text,
  discount_code text,
  discount_percent int,
  province text,
  city text,
  barangay text,
  postal_code text,
  address_line text,
  admin_note text,
  created_at timestamptz,
  full_name text,
  email text,
  phone text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  return query
  select
    r.id,
    r.profile_id,
    r.status,
    r.discount_code,
    r.discount_percent,
    r.province,
    r.city,
    r.barangay,
    r.postal_code,
    r.address_line,
    r.admin_note,
    r.created_at,
    coalesce(p.full_name, '') as full_name,
    coalesce(p.email, '') as email,
    p.phone
  from public.resellers r
  join public.profiles p on p.id = r.profile_id
  order by r.created_at desc;
end;
$$;

revoke all on function public.admin_list_resellers() from public;
grant execute on function public.admin_list_resellers() to authenticated;

create or replace function public.admin_update_reseller(
  p_reseller_id uuid,
  p_status text,
  p_discount_code text default null,
  p_discount_percent int default null,
  p_admin_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := nullif(upper(trim(coalesce(p_discount_code, ''))), '');
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  if p_status not in ('pending', 'approved', 'rejected', 'suspended') then
    raise exception 'Invalid status';
  end if;

  if p_status = 'approved' then
    if v_code is null then
      raise exception 'Discount code is required for approval';
    end if;
    if p_discount_percent is null or p_discount_percent < 1 or p_discount_percent > 100 then
      raise exception 'Discount percent must be between 1 and 100';
    end if;
    if exists (
      select 1 from public.resellers
      where upper(discount_code) = v_code
        and id <> p_reseller_id
    ) then
      raise exception 'That discount code is already in use';
    end if;

    update public.resellers
    set
      status = 'approved',
      discount_code = v_code,
      discount_percent = p_discount_percent,
      admin_note = nullif(trim(coalesce(p_admin_note, '')), ''),
      approved_at = coalesce(approved_at, now()),
      approved_by = coalesce(approved_by, auth.uid()),
      updated_at = now()
    where id = p_reseller_id;
  else
    update public.resellers
    set
      status = p_status,
      admin_note = nullif(trim(coalesce(p_admin_note, '')), ''),
      updated_at = now()
    where id = p_reseller_id;
  end if;

  if not found then
    raise exception 'Reseller not found';
  end if;
end;
$$;

revoke all on function public.admin_update_reseller(uuid, text, text, int, text) from public;
grant execute on function public.admin_update_reseller(uuid, text, text, int, text) to authenticated;