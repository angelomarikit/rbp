-- Atomic checkout: single RPC for order + line items

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

  insert into orders (
    status,
    subtotal_cents,
    shipping_cents,
    total_cents,
    payment_method,
    shipping_address
  )
  values (
    'payment_pending',
    p_subtotal_cents,
    p_shipping_cents,
    p_total_cents,
    p_payment_method,
    p_shipping_address
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into order_items (
      order_id,
      product_id,
      variant_key,
      quantity,
      unit_price_cents,
      product_name
    )
    values (
      v_order_id,
      v_item->>'product_id',
      nullif(v_item->>'variant_key', ''),
      (v_item->>'quantity')::int,
      (v_item->>'unit_price_cents')::int,
      v_item->>'product_name'
    );
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.create_order_with_items(int, int, int, text, jsonb, jsonb) from public;
grant execute on function public.create_order_with_items(int, int, int, text, jsonb, jsonb) to anon, authenticated;

-- Tighten direct inserts (prefer RPC)
drop policy if exists "Anon insert orders" on orders;
drop policy if exists "Anon insert order items" on order_items;