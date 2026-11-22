-- 008 — Orders, payment review, and J&T-ready fulfillment
-- A tracking number is a manual record. It does not book a J&T shipment.
-- shipping_rates starts empty. Do not insert guessed J&T fees.
-- Origin is Taguig, Philippines. Rates are loaded later from verified J&T data.

alter table public.orders add column if not exists customer_id uuid references public.profiles (id) on delete set null;
alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists payment_status text not null default 'pending';
alter table public.orders add column if not exists fulfillment_status text not null default 'unfulfilled';
alter table public.orders add column if not exists updated_at timestamptz not null default now();

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending', 'proof_submitted', 'verified', 'rejected'));

alter table public.orders drop constraint if exists orders_fulfillment_status_check;
alter table public.orders
  add constraint orders_fulfillment_status_check
  check (fulfillment_status in ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled'));

create unique index if not exists orders_order_number_unique
  on public.orders (order_number) where order_number is not null;

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_customer_idx on public.orders (customer_id);

alter table public.order_items add column if not exists product_uuid uuid references public.products (id) on delete set null;
alter table public.order_items add column if not exists variant_id uuid references public.product_variants (id) on delete set null;

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  note text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  courier text not null default 'jnt',
  origin_city text not null default 'Taguig',
  destination_summary text,
  tracking_number text,
  status text not null default 'unfulfilled',
  booked_with_courier boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled'))
);

comment on column public.shipments.tracking_number is
  'Manual J&T tracking number. Saving this value does not book a shipment.';
comment on column public.shipments.booked_with_courier is
  'True only after a future J&T API booking succeeds. Never set this from a typed tracking number.';

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  status text not null,
  note text,
  actor_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  courier text not null default 'jnt',
  origin_city text not null default 'Taguig',
  destination_area text not null,
  service_level text not null,
  rate_cents int not null check (rate_cents >= 0),
  source_note text not null,
  verified_on date,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.shipping_rates is
  'Leave empty until rates are copied from a verified J&T rate card. Do not guess fees.';

create table if not exists public.courier_integrations (
  courier text primary key,
  enabled boolean not null default false,
  api_base_url text,
  credentials_secret_name text,
  notes text not null
);

insert into public.courier_integrations (courier, enabled, notes)
values (
  'jnt',
  false,
  'Manual tracking only. Origin is Taguig, Philippines. A tracking number is not an API booking. Wire the J&T API later; do not invent rates.'
)
on conflict (courier) do nothing;

create or replace function public.orders_assign_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or btrim(new.order_number) = '' then
    new.order_number := 'RBP-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(new.id::text, '-', ''), 1, 6));
  end if;
  if new.customer_id is null then
    new.customer_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_assign_number on public.orders;
create trigger orders_assign_number
before insert on public.orders
for each row execute function public.orders_assign_number();

create or replace function public.shipments_reset_booking_flag()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or new.tracking_number is distinct from old.tracking_number then
    new.booked_with_courier := false;
  end if;
  return new;
end;
$$;

create or replace function public.shipments_log_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_note text := 'Status updated';
begin
  if tg_op = 'INSERT' then
    if new.tracking_number is not null then
      v_note := 'Tracking number recorded manually. Shipment was not booked with J&T.';
    end if;
  elsif new.status is distinct from old.status or new.tracking_number is distinct from old.tracking_number then
    if new.tracking_number is distinct from old.tracking_number and new.tracking_number is not null then
      v_note := 'Tracking number recorded manually. Shipment was not booked with J&T.';
    end if;
  else
    return null;
  end if;

  insert into public.shipment_events (shipment_id, status, note, actor_id)
  values (new.id, new.status, v_note, auth.uid());
  return null;
end;
$$;

drop trigger if exists shipments_reset_booking_flag on public.shipments;
create trigger shipments_reset_booking_flag
before insert or update on public.shipments
for each row execute function public.shipments_reset_booking_flag();

drop trigger if exists shipments_log_status on public.shipments;
create trigger shipments_log_status
after insert or update on public.shipments
for each row execute function public.shipments_log_status();

-- Keep the existing checkout RPC signature. Attach the signed-in customer when present.
create or replace function public.create_order_with_items(
  p_subtotal_cents int,
  p_shipping_cents int,
  p_total_cents int,
  p_payment_method text,
  p_shipping_address jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart must contain at least one item';
  end if;
  if p_subtotal_cents < 0 or p_shipping_cents < 0 or p_total_cents < 0 then
    raise exception 'Amounts cannot be negative';
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
    customer_id
  )
  values (
    'payment_pending',
    p_subtotal_cents,
    p_shipping_cents,
    p_total_cents,
    p_payment_method,
    p_shipping_address,
    'pending',
    'unfulfilled',
    auth.uid()
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
      product_name
    )
    values (
      v_order_id,
      v_item->>'product_id',
      nullif(v_item->>'product_uuid', '')::uuid,
      nullif(v_item->>'variant_key', ''),
      (v_item->>'quantity')::int,
      (v_item->>'unit_price_cents')::int,
      v_item->>'product_name'
    );
  end loop;

  insert into public.shipments (order_id, courier, origin_city, destination_summary, status)
  values (
    v_order_id,
    'jnt',
    'Taguig',
    concat_ws(', ', p_shipping_address->>'city', p_shipping_address->>'province'),
    'unfulfilled'
  );

  return v_order_id;
end;
$$;

revoke all on function public.create_order_with_items(int, int, int, text, jsonb, jsonb) from public;
grant execute on function public.create_order_with_items(int, int, int, text, jsonb, jsonb) to anon, authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.courier_integrations enable row level security;

drop policy if exists "Admin read orders" on public.orders;
create policy "Admin read orders" on public.orders
for select using (public.is_admin() or customer_id = auth.uid());

drop policy if exists "Admin update orders" on public.orders;
create policy "Admin update orders" on public.orders
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read own order items" on public.order_items;
create policy "Read own order items" on public.order_items
for select using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = auth.uid()
  )
);

drop policy if exists "Admin read proofs" on public.payment_proofs;
create policy "Admin read proofs" on public.payment_proofs
for select using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = auth.uid()
  )
);

drop policy if exists "Admin write proofs" on public.payment_proofs;
create policy "Admin write proofs" on public.payment_proofs
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read own shipments" on public.shipments;
create policy "Read own shipments" on public.shipments
for select using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = auth.uid()
  )
);

drop policy if exists "Admin write shipments" on public.shipments;
create policy "Admin write shipments" on public.shipments
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Read own shipment events" on public.shipment_events;
create policy "Read own shipment events" on public.shipment_events
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.shipments s
    join public.orders o on o.id = s.order_id
    where s.id = shipment_id and o.customer_id = auth.uid()
  )
);

drop policy if exists "Admin write shipment events" on public.shipment_events;
create policy "Admin write shipment events" on public.shipment_events
for insert with check (public.is_admin());

drop policy if exists "Public read active rates" on public.shipping_rates;
create policy "Public read active rates" on public.shipping_rates
for select using (active = true or public.is_admin());

drop policy if exists "Admin write rates" on public.shipping_rates;
create policy "Admin write rates" on public.shipping_rates
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin read couriers" on public.courier_integrations;
create policy "Admin read couriers" on public.courier_integrations
for select using (public.is_admin());

drop policy if exists "Admin write couriers" on public.courier_integrations;
create policy "Admin write couriers" on public.courier_integrations
for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists orders_audit on public.orders;
create trigger orders_audit
after update on public.orders
for each row execute function public.write_audit();
