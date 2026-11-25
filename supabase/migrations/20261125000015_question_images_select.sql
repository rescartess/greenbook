-- 0015: let admins look up question pictures.
-- Uploading with "replace if it exists" (upsert) first checks whether the picture
-- is already there, which needs a SELECT permission. Students don't need this:
-- the bucket is public, so pictures are shown through their public address.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    drop policy if exists "Admins see question images" on storage.objects;
    create policy "Admins see question images" on storage.objects
      for select to authenticated
      using (bucket_id = 'question-images' and (select private.is_admin()));
  end if;
end $$;
