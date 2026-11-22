-- 007 — Website content shared by the storefront
-- Homepage, events, gallery, about, and contact read these same rows.
-- Current React pages are not switched over until the admin is built.

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'Romell Body Piercing',
  phone text,
  email text,
  address text,
  city text not null default 'Taguig',
  facebook_url text,
  instagram_url text,
  whatsapp text,
  viber text,
  footer_text text,
  seo_title text,
  seo_description text,
  logo_path text,
  low_stock_threshold int not null default 5,
  shipping_origin text not null default 'Taguig, Philippines',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.content_sections (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  section_key text not null,
  title text,
  subtitle text,
  body text,
  media_path text,
  mobile_media_path text,
  buttons jsonb not null default '[]'::jsonb,
  extra jsonb not null default '{}'::jsonb,
  visible boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  unique (page, section_key)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  summary text,
  body jsonb not null default '[]'::jsonb,
  image_path text,
  event_date text,
  location text,
  kind text not null default 'featured' check (kind in ('featured', 'upcoming')),
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  quote text not null,
  rating int not null default 5 check (rating between 1 and 5),
  image_path text,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.showcase_items (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  media_kind text not null default 'image' check (media_kind in ('image', 'video')),
  caption text,
  placement text not null default 'both' check (placement in ('home', 'events', 'both')),
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  caption text,
  category text,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  keywords text[] not null default '{}',
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.media_files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  storage_path text not null,
  media_kind text not null default 'image' check (media_kind in ('image', 'video', 'document')),
  alt text,
  width int,
  height int,
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create or replace function public.events_set_slug()
returns trigger
language plpgsql
as $$
declare
  base text;
  candidate text;
  n int := 1;
begin
  if new.slug is null or btrim(new.slug) = '' then
    base := public.slugify(new.title);
    if base = '' then
      base := 'event';
    end if;
    candidate := base;
    while exists (
      select 1 from public.events e
      where e.slug = candidate and e.id is distinct from new.id
    ) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists events_set_slug on public.events;
create trigger events_set_slug
before insert or update of title, slug on public.events
for each row execute function public.events_set_slug();

drop trigger if exists site_settings_audit on public.site_settings;
create trigger site_settings_audit
after insert or update or delete on public.site_settings
for each row execute function public.write_audit();

drop trigger if exists content_sections_audit on public.content_sections;
create trigger content_sections_audit
after insert or update or delete on public.content_sections
for each row execute function public.write_audit();

drop trigger if exists events_audit on public.events;
create trigger events_audit
after insert or update or delete on public.events
for each row execute function public.write_audit();

alter table public.site_settings enable row level security;
alter table public.content_sections enable row level security;
alter table public.events enable row level security;
alter table public.testimonials enable row level security;
alter table public.showcase_items enable row level security;
alter table public.gallery_items enable row level security;
alter table public.faqs enable row level security;
alter table public.media_files enable row level security;

drop policy if exists "Public read settings" on public.site_settings;
create policy "Public read settings" on public.site_settings for select using (true);
drop policy if exists "Admin write settings" on public.site_settings;
create policy "Admin write settings" on public.site_settings
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read visible sections" on public.content_sections;
create policy "Public read visible sections" on public.content_sections
for select using (visible = true or public.is_admin());
drop policy if exists "Admin write sections" on public.content_sections;
create policy "Admin write sections" on public.content_sections
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read published events" on public.events;
create policy "Public read published events" on public.events
for select using (published = true or public.is_admin());
drop policy if exists "Admin write events" on public.events;
create policy "Admin write events" on public.events
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read testimonials" on public.testimonials;
create policy "Public read testimonials" on public.testimonials
for select using (published = true or public.is_admin());
drop policy if exists "Admin write testimonials" on public.testimonials;
create policy "Admin write testimonials" on public.testimonials
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read showcase" on public.showcase_items;
create policy "Public read showcase" on public.showcase_items
for select using (published = true or public.is_admin());
drop policy if exists "Admin write showcase" on public.showcase_items;
create policy "Admin write showcase" on public.showcase_items
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read gallery" on public.gallery_items;
create policy "Public read gallery" on public.gallery_items
for select using (published = true or public.is_admin());
drop policy if exists "Admin write gallery" on public.gallery_items;
create policy "Admin write gallery" on public.gallery_items
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read faqs" on public.faqs;
create policy "Public read faqs" on public.faqs
for select using (published = true or public.is_admin());
drop policy if exists "Admin write faqs" on public.faqs;
create policy "Admin write faqs" on public.faqs
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read media files" on public.media_files;
create policy "Public read media files" on public.media_files
for select using (bucket = 'storefront-media' or public.is_admin());
drop policy if exists "Admin write media files" on public.media_files;
create policy "Admin write media files" on public.media_files
for all using (public.is_admin()) with check (public.is_admin());
