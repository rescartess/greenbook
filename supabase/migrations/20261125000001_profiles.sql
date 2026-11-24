-- 0001 Profiles: one row per student, created automatically on sign-up.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  target_score integer check (target_score between 400 and 1600),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Students read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Students update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Students may change their name and target score, never their role.
revoke update on public.profiles from authenticated;
grant update (display_name, target_score) on public.profiles to authenticated;

-- Create the profile when someone signs up for the first time.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- True when the signed-in user is an admin. Used by content policies.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
