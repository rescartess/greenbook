-- 0020 Profile settings (owner request, 26 Nov 2026): two site colors, a profile photo and the SAT date.
--
-- accent_color: the main color (buttons, selected items, progress). background_color: the page
-- background tint. Both '#rrggbb' or null for GreenBook's own colors. They change the pages around the
-- exam only; the test and practice screens keep their own colors.
-- avatar_path: the student's photo in the public "avatars" bucket, always inside their own folder.
-- test_date: the day of their SAT, for a countdown.

alter table public.profiles
  add column accent_color text check (accent_color ~ '^#[0-9a-f]{6}$'),
  add column background_color text check (background_color ~ '^#[0-9a-f]{6}$'),
  add column avatar_path text check (avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-]{1,40}\.webp$' and split_part(avatar_path, '/', 1) = id::text),
  add column test_date date check (test_date between date '2024-01-01' and date '2035-12-31');

grant update (accent_color, background_color, avatar_path, test_date) on public.profiles to authenticated;

-- Profile photos: public bucket (shown by address), small webp files, each student writes only their own folder.
do $storage$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('avatars', 'avatars', true, 512000, array['image/webp'])
    on conflict (id) do update set public = true, file_size_limit = 512000, allowed_mime_types = array['image/webp'];
    execute $p$drop policy if exists "Students add their own photo" on storage.objects$p$;
    execute $p$drop policy if exists "Students see their own photo files" on storage.objects$p$;
    execute $p$drop policy if exists "Students remove their own photo" on storage.objects$p$;
    execute $p$create policy "Students add their own photo" on storage.objects for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    execute $p$create policy "Students see their own photo files" on storage.objects for select to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    execute $p$create policy "Students remove their own photo" on storage.objects for delete to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
  end if;
end
$storage$;
