-- 009 — Inquiries, notifications, and Phase 2 customer records
-- Customers and admins share auth.users. Role lives on profiles.
-- Customer orders are the same orders table. There is no second order database.

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  email text not null,
  phone text not null,
  status text not null default 'open' check (status in ('open', 'replied', 'closed')),
  response text,
  source text not null default 'widget',
  responded_by uuid references public.profiles (id),
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  title text not null,
  entity text,
  entity_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  province text not null,
  city text not null,
  barangay text not null,
  postal_code text not null,
  address_line text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists customer_addresses_owner_idx on public.customer_addresses (customer_id);

create or replace function public.notify_new_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (kind, title, entity, entity_id)
  values ('inquiry', 'New unanswered question', 'inquiries', new.id::text);
  return new;
end;
$$;

drop trigger if exists inquiries_notify on public.inquiries;
create trigger inquiries_notify
after insert on public.inquiries
for each row execute function public.notify_new_inquiry();

drop trigger if exists inquiries_audit on public.inquiries;
create trigger inquiries_audit
after insert or update on public.inquiries
for each row execute function public.write_audit();

alter table public.inquiries enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.customer_addresses enable row level security;

drop policy if exists "Public create inquiry" on public.inquiries;
create policy "Public create inquiry" on public.inquiries
for insert with check (
  status = 'open'
  and response is null
  and char_length(btrim(question)) > 0
  and char_length(btrim(phone)) > 0
  and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

drop policy if exists "Admin manage inquiries" on public.inquiries;
create policy "Admin manage inquiries" on public.inquiries
for select using (public.is_admin());

drop policy if exists "Admin update inquiries" on public.inquiries;
create policy "Admin update inquiries" on public.inquiries
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin read notifications" on public.admin_notifications;
create policy "Admin read notifications" on public.admin_notifications
for select using (public.is_admin());

drop policy if exists "Admin update notifications" on public.admin_notifications;
create policy "Admin update notifications" on public.admin_notifications
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Own addresses" on public.customer_addresses;
create policy "Own addresses" on public.customer_addresses
for all using (customer_id = auth.uid() or public.is_admin())
with check (customer_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.customer_addresses to authenticated;
grant insert on public.inquiries to anon, authenticated;
grant select, update on public.inquiries to authenticated;
grant select, update on public.admin_notifications to authenticated;
