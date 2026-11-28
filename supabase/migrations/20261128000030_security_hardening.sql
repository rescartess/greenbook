-- 0030 Security hardening (owner request 28 Nov 2026).
-- 1. Visitors who aren't signed in ("anon") lose every table right. RLS already showed them nothing;
--    this way a future mistake in a policy can't open anything either.
-- 2. Signed-in users lose TRUNCATE, REFERENCES and TRIGGER (never needed; TRUNCATE ignores RLS).
-- 3. Names are 1 to 40 characters in the database too, like the profile form.
-- 4. Students can delete their own account (delete_my_account).
-- 5. The class code stops answering after 20 wrong codes in 10 minutes (guessing guard).

-- 1 + 2
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
alter default privileges in schema public revoke truncate, references, trigger on tables from authenticated;

-- 3
alter table public.profiles
  add constraint profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 40);

-- 4
create or replace function public.delete_my_account()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles p where p.id = v_user and p.role = 'admin') then
    raise exception 'The admin account can’t be deleted here' using errcode = '42501';
  end if;
  -- Profile, attempts, answers and progress go with it (on delete cascade).
  delete from auth.users where id = v_user;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 5
create table private.code_failures (at timestamptz not null default now());
alter table private.code_failures enable row level security;
create index code_failures_at on private.code_failures (at);

-- A wrong code now returns null instead of an error, so the failure can be counted
-- (an error would undo the count). The website shows "That invite code isn’t right" for null.
create or replace function public.invite_code_password(p_email text, p_code text)
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
  if (select count(*) from private.code_failures where at > now() - interval '10 minutes') >= 20 then
    raise exception 'Too many wrong codes. Wait 10 minutes.' using errcode = 'P0016';
  end if;
  if upper(trim(coalesce(p_code, ''))) <> upper(v_row.code) then
    delete from private.code_failures where at < now() - interval '1 day';
    insert into private.code_failures default values;
    perform pg_sleep(0.5); -- slows down guessing
    return null;
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

  -- Never change an existing account's password (0029).
  if v_exists and (
    coalesce(v_user.encrypted_password, '') = ''
    or v_user.encrypted_password <> extensions.crypt(v_password, v_user.encrypted_password)
  ) then
    raise exception 'This account signs in another way' using errcode = 'P0015';
  end if;

  return v_password;
end;
$$;
revoke all on function public.invite_code_password(text, text) from public;
grant execute on function public.invite_code_password(text, text) to anon, authenticated;
