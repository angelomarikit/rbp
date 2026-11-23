-- Use LBC for shipments. Tracking numbers stay a manual record.
-- This does not add shipping rates.
-- Run this in the Supabase SQL editor.

alter table public.shipments alter column courier set default 'lbc';
alter table public.shipping_rates alter column courier set default 'lbc';

update public.shipments set courier = 'lbc' where courier = 'jnt';
update public.shipping_rates set courier = 'lbc' where courier = 'jnt';
update public.shipment_events set note = replace(note, 'J&T', 'LBC') where note like '%J&T%';

comment on column public.shipments.tracking_number is
  'Manual LBC tracking number. Saving this value does not book a shipment.';
comment on column public.shipments.booked_with_courier is
  'True only after a future LBC booking succeeds. Never set this from a typed tracking number.';

insert into public.courier_integrations (courier, enabled, notes)
values (
  'lbc',
  false,
  'Manual tracking only. Origin is Taguig, Philippines. A tracking number is not an API booking. Do not invent rates.'
)
on conflict (courier) do update set notes = excluded.notes;

delete from public.courier_integrations where courier = 'jnt';

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
      v_note := 'Tracking number recorded manually. Shipment was not booked with LBC.';
    end if;
  elsif new.status is distinct from old.status or new.tracking_number is distinct from old.tracking_number then
    if new.tracking_number is distinct from old.tracking_number and new.tracking_number is not null then
      v_note := 'Tracking number recorded manually. Shipment was not booked with LBC.';
    end if;
  else
    return null;
  end if;

  insert into public.shipment_events (shipment_id, status, note, actor_id)
  values (new.id, new.status, v_note, auth.uid());
  return null;
end;
$$;

alter table public.order_items add column if not exists image_path text;

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

revoke all on function public.create_order_with_items(int, int, int, text, jsonb, jsonb) from public;
grant execute on function public.create_order_with_items(int, int, int, text, jsonb, jsonb) to anon, authenticated;
