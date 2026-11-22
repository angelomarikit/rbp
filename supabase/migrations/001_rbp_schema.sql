-- Romell Body Piercing catalog & checkout schema

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price_cents int not null,
  category text not null,
  material text not null,
  image_path text not null,
  specs jsonb,
  description text,
  review_count int,
  rating numeric(2,1),
  created_at timestamptz default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  variant_key text not null,
  label text not null,
  image_path text
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',
  subtotal_cents int not null,
  shipping_cents int not null,
  total_cents int not null,
  payment_method text not null,
  shipping_address jsonb not null,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id text not null,
  variant_key text,
  quantity int not null,
  unit_price_cents int not null,
  product_name text not null
);

alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Public read products" on products for select using (true);
create policy "Public read variants" on product_variants for select using (true);
create policy "Anon insert orders" on orders for insert with check (true);
create policy "Anon insert order items" on order_items for insert with check (true);