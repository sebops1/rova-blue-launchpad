create policy "auth read rovax files" on storage.objects for select to authenticated
  using (bucket_id in ('site-photos','documents'));
create policy "editors upload rovax files" on storage.objects for insert to authenticated
  with check (bucket_id in ('site-photos','documents') and public.can_edit(auth.uid()));
create policy "editors update rovax files" on storage.objects for update to authenticated
  using (bucket_id in ('site-photos','documents') and public.can_edit(auth.uid()));
create policy "editors delete rovax files" on storage.objects for delete to authenticated
  using (bucket_id in ('site-photos','documents') and public.can_edit(auth.uid()));