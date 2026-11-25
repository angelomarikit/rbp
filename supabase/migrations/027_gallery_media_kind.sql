-- Association gallery: distinguish photos from videos in the Instagram-style grid.

alter table public.gallery_items
  add column if not exists media_kind text not null default 'image'
  check (media_kind in ('image', 'video'));