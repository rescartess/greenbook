-- 0016: log in with an invite code.
-- The owner sets one invite code for everyone. A student types their email and the
-- code; the server turns those into the student's own password (a keyed hash of the
-- email that only the database knows) and signs them in. No email is sent.
-- Admins can't use the code: they keep the emailed sign-in link.

create extension if not exists pgcrypto with schema extensions;

create table private.invite_code (
  id int primary key default 1 check (id = 1),
  code text,
  secret bytea not null default extensions.gen_random_bytes(32),
  updated_at timestamptz not null default now()
);
alter table private.invite_code enable row level security;
insert into private.invite_code (id) values (1);

-- Checks the invite code and returns the student's password. Sets that password on
-- an existing student account (accounts first made with an emailed link have none).
create function public.invite_code_password(p_email text, p_code text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_row private.invite_code;
  v_password text;
  v_user auth.users;
  v_exists boolean;
begin
  select * into v_row from private.invite_code where id = 1;
  if v_row.code is null or v_row.code = '' then
    raise exception 'Invite codes are turned off' using errcode = 'P0010';
  end if;
  if upper(trim(coalesce(p_code, ''))) <> upper(v_row.code) then
    perform pg_sleep(0.5); -- slows down guessing
    raise exception 'Wrong invite code' using errcode = 'P0011';
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' or length(v_email) > 254 then
    raise exception 'Bad email' using errcode = 'P0012';
  end if;

  select u.* into v_user from auth.users u where lower(u.email) = v_email limit 1;
  v_exists := found;
  if v_exists and exists (select 1 from public.profiles p where p.id = v_user.id and p.role = 'admin') then
    raise exception 'Admins log in with an emailed link' using errcode = 'P0013';
  end if;

  v_password := encode(extensions.hmac(convert_to(v_email, 'UTF8'), v_row.secret, 'sha256'), 'hex');

  if v_exists and (
    coalesce(v_user.encrypted_password, '') = ''
    or v_user.encrypted_password <> extensions.crypt(v_password, v_user.encrypted_password)
  ) then
    update auth.users
      set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf', 10)),
          email_confirmed_at = coalesce(email_confirmed_at, now())
      where id = v_user.id;
  end if;

  return v_password;
end;
$$;

revoke all on function public.invite_code_password(text, text) from public;
grant execute on function public.invite_code_password(text, text) to anon, authenticated;

-- Admin: read and change the invite code (empty turns it off).
create function public.admin_get_invite_code()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return (select code from private.invite_code where id = 1);
end;
$$;

create function public.admin_set_invite_code(p_code text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_code text := nullif(upper(trim(coalesce(p_code, ''))), '');
begin
  if not (select private.is_admin()) then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if v_code is not null and (length(v_code) < 6 or length(v_code) > 40) then
    raise exception 'The code needs 6 to 40 characters' using errcode = 'P0014';
  end if;
  update private.invite_code set code = v_code, updated_at = now() where id = 1;
end;
$$;

revoke all on function public.admin_get_invite_code() from public, anon;
revoke all on function public.admin_set_invite_code(text) from public, anon;
grant execute on function public.admin_get_invite_code() to authenticated;
grant execute on function public.admin_set_invite_code(text) to authenticated;
