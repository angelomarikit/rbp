-- 017 — Customer payment screenshot and the last 4 digits of the reference number.
alter table public.payment_proofs
  add column if not exists reference_last4 text;

alter table public.payment_proofs
  drop constraint if exists payment_proofs_reference_last4_check;
alter table public.payment_proofs
  add constraint payment_proofs_reference_last4_check
  check (reference_last4 is null or reference_last4 ~ '^[0-9]{4}$');

create or replace function public.attach_payment_proof(
  p_order_id uuid,
  p_storage_path text,
  p_reference_last4 text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid;
  v_id uuid;
begin
  if p_reference_last4 is null or p_reference_last4 !~ '^[0-9]{4}$' then
    raise exception 'Enter the last 4 digits of the reference number';
  end if;
  if p_storage_path is null or split_part(p_storage_path, '/', 1) <> 'orders' or split_part(p_storage_path, '/', 2) <> p_order_id::text then
    raise exception 'Payment screenshot does not match this order';
  end if;

  select customer_id into v_customer from public.orders where id = p_order_id;
  if not found then
    raise exception 'Order not found';
  end if;
  if auth.uid() is not null and v_customer is not null and v_customer <> auth.uid() and not public.is_admin() then
    raise exception 'This order is not on your account';
  end if;
  if auth.uid() is null and v_customer is not null then
    raise exception 'Sign in to add a payment screenshot to this order';
  end if;

  insert into public.payment_proofs (order_id, storage_path, note, reference_last4, status)
  values (p_order_id, p_storage_path, p_reference_last4, p_reference_last4, 'pending')
  returning id into v_id;

  update public.orders
  set payment_status = 'proof_submitted', updated_at = now()
  where id = p_order_id
    and payment_status in ('pending', 'proof_submitted');

  return v_id;
end;
$$;

revoke all on function public.attach_payment_proof(uuid, text, text) from public;
grant execute on function public.attach_payment_proof(uuid, text, text) to anon, authenticated;

drop policy if exists "Read own or admin payment proofs" on storage.objects;
create policy "Read own or admin payment proofs"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
    or (
      (storage.foldername(name))[1] = 'orders'
      and exists (
        select 1 from public.orders o
        where o.id::text = (storage.foldername(name))[2]
          and o.customer_id = auth.uid()
      )
    )
  )
);

drop policy if exists "Upload payment proof for an order" on storage.objects;
create policy "Upload payment proof for an order"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = 'orders'
);
