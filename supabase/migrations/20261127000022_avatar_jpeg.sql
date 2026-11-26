-- 0022 Profile photos may also be JPEG (27 Nov 2026). Safari can't make WebP pictures in the
-- browser, so photos from Safari are saved as .jpg. Same rules otherwise: own folder, small file.

alter table public.profiles drop constraint if exists profiles_check;
alter table public.profiles add constraint profiles_avatar_path_check check (
  avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-]{1,40}\.(webp|jpg)$' and split_part(avatar_path, '/', 1) = id::text
);

do $storage$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    update storage.buckets set allowed_mime_types = array['image/webp', 'image/jpeg'] where id = 'avatars';
  end if;
end
$storage$;
