-- 005 — Roles, profiles, and audit log
-- Run after 001–004. Safe to re-run.
-- First admin is NOT created here. After you sign up, run the promotion
-- statement at the bottom of this file in the SQL editor (auth.uid() is null
-- there, so the role lock does not block it).

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx on public.audit_logs (entity, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();

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
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_lock on public.profiles;
create trigger profiles_role_lock
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- A permission error here must not roll back profiles and the helper functions.
do $$
begin
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
exception
  when insufficient_privilege or undefined_table then
    raise notice 'Skipped auth.users trigger. Profiles still exist; attach the trigger later as the table owner.';
end $$;

create or replace function public.write_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'insert';
    v_id := coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'slug');
    insert into public.audit_logs (actor_id, action, entity, entity_id, changes)
    values (auth.uid(), v_action, tg_table_name, v_id, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    v_id := coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'slug');
    insert into public.audit_logs (actor_id, action, entity, entity_id, changes)
    values (auth.uid(), 'update', tg_table_name, v_id, jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
    return new;
  else
    v_id := coalesce(to_jsonb(old)->>'id', to_jsonb(old)->>'slug');
    insert into public.audit_logs (actor_id, action, entity, entity_id, changes)
    values (auth.uid(), 'delete', tg_table_name, v_id, to_jsonb(old));
    return old;
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
for select using (id = auth.uid() or public.is_admin());

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "Admin read audit" on public.audit_logs;
create policy "Admin read audit" on public.audit_logs
for select using (public.is_admin());

-- Promote the owner after they have signed up once:
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL_HERE';
