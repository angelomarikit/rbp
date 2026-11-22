-- 006 — Collections, product fields, images, and variations
-- Extends the existing products / product_variants tables.
-- Does not delete products. Archiving sets status; it does not remove order history.
-- order_items.product_id stays text so old orders survive an archive or delete.
-- Requires 005. The helper below is repeated so a partial 005 run cannot block this file.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.products add column if not exists sku text;
alter table public.products add column if not exists compare_at_price_cents int;
alter table public.products add column if not exists inventory_qty int;
alter table public.products add column if not exists status text not null default 'active';
alter table public.products add column if not exists published boolean not null default true;
alter table public.products add column if not exists archived_at timestamptz;
alter table public.products add column if not exists updated_at timestamptz not null default now();

alter table public.products drop constraint if exists products_status_check;
alter table public.products
  add constraint products_status_check check (status in ('draft', 'active', 'archived'));

create unique index if not exists products_sku_unique on public.products (sku) where sku is not null;

alter table public.product_variants add column if not exists sku text;
alter table public.product_variants add column if not exists price_cents int;
alter table public.product_variants add column if not exists compare_at_price_cents int;
alter table public.product_variants add column if not exists inventory_qty int;
alter table public.product_variants add column if not exists options jsonb not null default '{}'::jsonb;
alter table public.product_variants add column if not exists status text not null default 'active';
alter table public.product_variants add column if not exists sort_order int not null default 0;

alter table public.product_variants drop constraint if exists product_variants_status_check;
alter table public.product_variants
  add constraint product_variants_status_check check (status in ('active', 'archived'));

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  description text,
  image_path text,
  featured boolean not null default false,
  sort_order int not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_collections (
  product_id uuid not null references public.products (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  sort_order int not null default 0,
  primary key (product_id, collection_id)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.variation_options (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  sort_order int not null default 0
);

create table if not exists public.variation_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.variation_options (id) on delete cascade,
  value text not null,
  sort_order int not null default 0,
  unique (option_id, value)
);

create or replace function public.products_set_slug()
returns trigger
language plpgsql
as $$
declare
  base text;
  candidate text;
  n int := 1;
begin
  if new.slug is null or btrim(new.slug) = '' then
    base := public.slugify(new.name);
    if base = '' then
      base := 'product';
    end if;
    candidate := base;
    while exists (
      select 1 from public.products p
      where p.slug = candidate and p.id is distinct from new.id
    ) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  if new.sku is null or btrim(new.sku) = '' then
    new.sku := 'RBP-' || upper(substr(replace(new.slug, '-', ''), 1, 10));
  end if;
  return new;
end;
$$;

drop trigger if exists products_set_slug on public.products;
create trigger products_set_slug
before insert or update of name, slug, sku on public.products
for each row execute function public.products_set_slug();

create or replace function public.collections_set_slug()
returns trigger
language plpgsql
as $$
declare
  base text;
  candidate text;
  n int := 1;
begin
  if new.slug is null or btrim(new.slug) = '' then
    base := public.slugify(new.name);
    if base = '' then
      base := 'collection';
    end if;
    candidate := base;
    while exists (
      select 1 from public.collections c
      where c.slug = candidate and c.id is distinct from new.id
    ) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists collections_set_slug on public.collections;
create trigger collections_set_slug
before insert or update of name, slug on public.collections
for each row execute function public.collections_set_slug();

drop trigger if exists products_touch on public.products;
create trigger products_touch
before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists collections_touch on public.collections;
create trigger collections_touch
before update on public.collections
for each row execute function public.touch_updated_at();

drop trigger if exists products_audit on public.products;
create trigger products_audit
after insert or update or delete on public.products
for each row execute function public.write_audit();

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.collections enable row level security;
alter table public.product_collections enable row level security;
alter table public.product_images enable row level security;
alter table public.variation_options enable row level security;
alter table public.variation_option_values enable row level security;

drop policy if exists "Public read products" on public.products;
create policy "Public read products" on public.products
for select using (published = true and status = 'active' or public.is_admin());

drop policy if exists "Admin write products" on public.products;
create policy "Admin write products" on public.products
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read variants" on public.product_variants;
create policy "Public read variants" on public.product_variants
for select using (status = 'active' or public.is_admin());

drop policy if exists "Admin write variants" on public.product_variants;
create policy "Admin write variants" on public.product_variants
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read collections" on public.collections;
create policy "Public read collections" on public.collections
for select using (status = 'active' or public.is_admin());

drop policy if exists "Admin write collections" on public.collections;
create policy "Admin write collections" on public.collections
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read product collections" on public.product_collections;
create policy "Public read product collections" on public.product_collections
for select using (true);

drop policy if exists "Admin write product collections" on public.product_collections;
create policy "Admin write product collections" on public.product_collections
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read product images" on public.product_images;
create policy "Public read product images" on public.product_images
for select using (true);

drop policy if exists "Admin write product images" on public.product_images;
create policy "Admin write product images" on public.product_images
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read variation options" on public.variation_options;
create policy "Public read variation options" on public.variation_options
for select using (true);

drop policy if exists "Admin write variation options" on public.variation_options;
create policy "Admin write variation options" on public.variation_options
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read variation values" on public.variation_option_values;
create policy "Public read variation values" on public.variation_option_values
for select using (true);

drop policy if exists "Admin write variation values" on public.variation_option_values;
create policy "Admin write variation values" on public.variation_option_values
for all using (public.is_admin()) with check (public.is_admin());
