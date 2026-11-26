-- 028 — Allow admins to delete inquiries from the admin inbox.

drop policy if exists "Admin delete inquiries" on public.inquiries;
create policy "Admin delete inquiries" on public.inquiries
for delete using (public.is_admin());

grant delete on public.inquiries to authenticated;