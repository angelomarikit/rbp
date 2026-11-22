create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  preferred_date text,
  piercing_type text,
  notes text,
  created_at timestamptz default now()
);

alter table booking_requests enable row level security;

create policy "Anon insert booking requests"
  on booking_requests for insert
  with check (true);