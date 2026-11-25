-- Reseller program: registration, discount codes, checkout attribution, ranking.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'customer', 'reseller'));

create table if not exists public.resellers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  discount_code text unique,
  discount_percent int check (discount_percent is null or (discount_percent >= 1 and discount_percent <= 100)),
  province text not null default '',
  city text not null default '',
  barangay text not null default '',
  postal_code text not null default '',
  address_line text not null default '',
  admin_note text,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resellers_status_idx on public.resellers (status);
create index if not exists resellers_discount_code_idx on public.resellers (upper(discount_code)) where discount_code is not null;

alter table public.orders add column if not exists discount_code text;
alter table public.orders add column if not exists reseller_id uuid references public.resellers (id) on delete set null;
alter table public.orders add column if not exists discount_percent int;
alter table public.orders add column if not exists discount_cents int not null default 0;

create index if not exists orders_reseller_idx on public.orders (reseller_id) where reseller_id is not null;

drop trigger if exists resellers_touch on public.resellers;
create trigger resellers_touch
before update on public.resellers
for each row execute function public.touch_updated_at();

create or replace function public.prevent_reseller_field_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.profile_id is distinct from old.profile_id
     or new.status is distinct from old.status
     or new.discount_code is distinct from old.discount_code
     or new.discount_percent is distinct from old.discount_percent
     or new.approved_at is distinct from old.approved_at
     or new.approved_by is distinct from old.approved_by
     or new.admin_note is distinct from old.admin_note then
    raise exception 'Only an admin can change approval or discount settings';
  end if;
  return new;
end;
$$;

drop trigger if exists resellers_field_lock on public.resellers;
create trigger resellers_field_lock
before update on public.resellers
for each row execute function public.prevent_reseller_field_escalation();

create or replace function public.reseller_id_for_auth()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select r.id
  from public.resellers r
  where r.profile_id = auth.uid()
  limit 1;
$$;

revoke all on function public.reseller_id_for_auth() from public;
grant execute on function public.reseller_id_for_auth() to authenticated;

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

  return v_id;
end;
$$;

revoke all on function public.register_reseller_profile(text, text, text, text, text, text) from public;
grant execute on function public.register_reseller_profile(text, text, text, text, text, text) to authenticated;

create or replace function public.validate_discount_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row public.resellers%rowtype;
  v_code text := upper(trim(coalesce(p_code, '')));
begin
  if v_code = '' then
    return jsonb_build_object('valid', false);
  end if;

  select * into v_row
  from public.resellers
  where upper(discount_code) = v_code
    and status = 'approved'
  limit 1;

  if not found or v_row.discount_percent is null then
    return jsonb_build_object('valid', false);
  end if;

  return jsonb_build_object(
    'valid', true,
    'code', v_row.discount_code,
    'percent', v_row.discount_percent
  );
end;
$$;

revoke all on function public.validate_discount_code(text) from public;
grant execute on function public.validate_discount_code(text) to anon, authenticated;

drop function if exists public.create_order_with_items(int, int, int, text, jsonb, jsonb);

create or replace function public.create_order_with_items(
  p_subtotal_cents int,
  p_shipping_cents int,
  p_total_cents int,
  p_payment_method text,
  p_shipping_address jsonb,
  p_items jsonb,
  p_discount_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_reseller_id uuid := null;
  v_reseller public.resellers%rowtype;
  v_code text := upper(trim(coalesce(p_discount_code, '')));
  v_discount_cents int := 0;
  v_discount_percent int := null;
  v_total int;
  v_discounted_subtotal int;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart must contain at least one item';
  end if;
  if p_subtotal_cents < 0 or p_shipping_cents < 0 then
    raise exception 'Amounts cannot be negative';
  end if;

  if v_code <> '' then
    select * into v_reseller
    from public.resellers
    where upper(discount_code) = v_code
      and status = 'approved'
    limit 1;
    if not found then
      raise exception 'Invalid or inactive discount code';
    end if;
    v_discount_percent := v_reseller.discount_percent;
    v_discount_cents := greatest(0, round(p_subtotal_cents * v_discount_percent / 100.0)::int);
    v_reseller_id := v_reseller.id;
  end if;

  v_discounted_subtotal := p_subtotal_cents - v_discount_cents;
  v_total := v_discounted_subtotal + p_shipping_cents;

  if p_total_cents <> v_total then
    raise exception 'Order total does not match the discount calculation';
  end if;

  insert into public.orders (
    status,
    subtotal_cents,
    shipping_cents,
    total_cents,
    payment_method,
    shipping_address,
    payment_status,
    fulfillment_status,
    customer_id,
    discount_code,
    reseller_id,
    discount_percent,
    discount_cents
  )
  values (
    'payment_pending',
    p_subtotal_cents,
    p_shipping_cents,
    v_total,
    p_payment_method,
    p_shipping_address,
    'pending',
    'unfulfilled',
    auth.uid(),
    nullif(v_code, ''),
    v_reseller_id,
    v_discount_percent,
    v_discount_cents
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      order_id,
      product_id,
      product_uuid,
      variant_key,
      quantity,
      unit_price_cents,
      product_name,
      image_path
    )
    values (
      v_order_id,
      v_item->>'product_id',
      nullif(v_item->>'product_uuid', '')::uuid,
      nullif(v_item->>'variant_key', ''),
      (v_item->>'quantity')::int,
      (v_item->>'unit_price_cents')::int,
      v_item->>'product_name',
      nullif(v_item->>'image_path', '')
    );
  end loop;

  insert into public.shipments (order_id, courier, origin_city, destination_summary, status)
  values (
    v_order_id,
    'lbc',
    'Taguig',
    concat_ws(', ', p_shipping_address->>'city', p_shipping_address->>'province'),
    'unfulfilled'
  );

  return v_order_id;
end;
$$;

revoke all on function public.create_order_with_items(int, int, int, text, jsonb, jsonb, text) from public;
grant execute on function public.create_order_with_items(int, int, int, text, jsonb, jsonb, text) to anon, authenticated;

create or replace function public.reseller_rankings()
returns table (
  reseller_id uuid,
  profile_id uuid,
  full_name text,
  discount_code text,
  order_count bigint,
  total_cents bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id as reseller_id,
    r.profile_id,
    coalesce(p.full_name, p.email, 'Reseller') as full_name,
    r.discount_code,
    count(o.id) filter (where o.payment_status = 'verified') as order_count,
    coalesce(sum(o.total_cents) filter (where o.payment_status = 'verified'), 0)::bigint as total_cents
  from public.resellers r
  join public.profiles p on p.id = r.profile_id
  left join public.orders o on o.reseller_id = r.id
  where r.status = 'approved'
  group by r.id, r.profile_id, p.full_name, p.email, r.discount_code
  order by total_cents desc, order_count desc, full_name asc;
$$;

revoke all on function public.reseller_rankings() from public;
grant execute on function public.reseller_rankings() to authenticated;

alter table public.resellers enable row level security;

drop policy if exists "Admin manage resellers" on public.resellers;
create policy "Admin manage resellers" on public.resellers
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Reseller read own" on public.resellers;
create policy "Reseller read own" on public.resellers
for select using (profile_id = auth.uid());

drop policy if exists "Reseller update own address" on public.resellers;
create policy "Reseller update own address" on public.resellers
for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "Admin read orders" on public.orders;
create policy "Admin read orders" on public.orders
for select using (
  public.is_admin()
  or customer_id = auth.uid()
  or (reseller_id is not null and reseller_id = public.reseller_id_for_auth())
);

drop policy if exists "Read own order items" on public.order_items;
create policy "Read own order items" on public.order_items
for select using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id
      and (
        o.customer_id = auth.uid()
        or (o.reseller_id is not null and o.reseller_id = public.reseller_id_for_auth())
      )
  )
);

drop policy if exists "Admin read proofs" on public.payment_proofs;
create policy "Admin read proofs" on public.payment_proofs
for select using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id
      and (
        o.customer_id = auth.uid()
        or (o.reseller_id is not null and o.reseller_id = public.reseller_id_for_auth())
      )
  )
);

drop policy if exists "Read own shipments" on public.shipments;
create policy "Read own shipments" on public.shipments
for select using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id
      and (
        o.customer_id = auth.uid()
        or (o.reseller_id is not null and o.reseller_id = public.reseller_id_for_auth())
      )
  )
);

drop policy if exists "Read own shipment events" on public.shipment_events;
create policy "Read own shipment events" on public.shipment_events
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.shipments s
    join public.orders o on o.id = s.order_id
    where s.id = shipment_id
      and (
        o.customer_id = auth.uid()
        or (o.reseller_id is not null and o.reseller_id = public.reseller_id_for_auth())
      )
  )
);

grant select on public.resellers to authenticated;