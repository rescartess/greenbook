-- 0005 Move internal helper functions out of the public API.
-- Policies and the sign-up trigger keep working: they point at the functions themselves, not their names.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

alter function public.is_admin() set schema private;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

alter function public.handle_new_user() set schema private;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
