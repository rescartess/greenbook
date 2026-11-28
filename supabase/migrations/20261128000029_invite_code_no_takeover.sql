-- 0029 Invite code: never change the password of an account that already exists.
-- Before: anyone with the shared class code could type any student's email and the database
-- reset that account's password to one it then handed back, so they could sign in as that
-- student (Google and emailed-link accounts too). Now an existing account is only let in when
-- its password already is the class-code password (it was made with the class code).
-- Everyone else is told to use the way they joined (P0015).

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
    raise exception 'This account signs in another way' using errcode = 'P0015';
  end if;

  return v_password;
end;
$$;
revoke all on function public.invite_code_password(text, text) from public;
grant execute on function public.invite_code_password(text, text) to anon, authenticated;

-- Not used by anyone calling the API; it only runs as the questions trigger.
revoke all on function public.bump_question_version() from public, anon, authenticated;
