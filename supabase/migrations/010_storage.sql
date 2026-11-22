-- 010 — Storage buckets
-- storefront-media is public and holds site files uploaded by an admin.
-- payment-proofs is private. Guests do not get a folder until they have an account.
-- Existing catalog images under public/assets stay where they are.
-- New admin uploads go in these buckets, not to third-party image hosts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'storefront-media',
    'storefront-media',
    true,
    52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
  ),
  (
    'payment-proofs',
    'payment-proofs',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read storefront media" on storage.objects;
create policy "Public read storefront media"
on storage.objects for select
using (bucket_id = 'storefront-media');

drop policy if exists "Admin write storefront media" on storage.objects;
create policy "Admin write storefront media"
on storage.objects for insert
with check (bucket_id = 'storefront-media' and public.is_admin());

drop policy if exists "Admin update storefront media" on storage.objects;
create policy "Admin update storefront media"
on storage.objects for update
using (bucket_id = 'storefront-media' and public.is_admin())
with check (bucket_id = 'storefront-media' and public.is_admin());

drop policy if exists "Admin delete storefront media" on storage.objects;
create policy "Admin delete storefront media"
on storage.objects for delete
using (bucket_id = 'storefront-media' and public.is_admin());

drop policy if exists "Read own or admin payment proofs" on storage.objects;
create policy "Read own or admin payment proofs"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "Customer upload own payment proof" on storage.objects;
create policy "Customer upload own payment proof"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admin delete payment proofs" on storage.objects;
create policy "Admin delete payment proofs"
on storage.objects for delete
using (bucket_id = 'payment-proofs' and public.is_admin());
