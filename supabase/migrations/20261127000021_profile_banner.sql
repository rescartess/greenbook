-- 0021 Profile banner on the dashboard (owner request, 27 Nov 2026), in the style of monkeytype:
-- a short bio the student writes, and their numbers: time practicing, questions answered,
-- best full-test score, and their place among all GreenBook students by time practicing.

alter table public.profiles
  add column bio text check (bio is null or char_length(bio) between 1 and 160);

grant update (bio) on public.profiles to authenticated;

-- Time spent in one attempt: from its start to its end (or, while unfinished, to the last saved
-- answer), at most 4 hours, so a tab left open overnight doesn't count as practice.
create or replace function private.attempt_seconds(p_attempt_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(least(14400, greatest(0, extract(epoch from (
    coalesce(a.finished_at, (
      select max(r.updated_at) from public.responses r
      join public.attempt_modules am on am.id = r.attempt_module_id
      where am.attempt_id = a.id
    )) - a.started_at
  ))))::integer, 0)
  from public.attempts a where a.id = p_attempt_id;
$$;

create or replace function public.get_my_banner(p_subject text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select (select auth.uid()) as id),
  totals as (
    select p.id, coalesce(sum(private.attempt_seconds(a.id)), 0)::integer as seconds
    from public.profiles p
    left join public.attempts a on a.user_id = p.id and a.status in ('in_progress', 'completed')
    where p.role = 'student' or p.id = (select id from me)
    group by p.id
  ),
  mine as (select seconds from totals where id = (select id from me))
  select jsonb_build_object(
    'joined', (select created_at from public.profiles where id = (select id from me)),
    'bio', (select bio from public.profiles where id = (select id from me)),
    'seconds', coalesce((select seconds from mine), 0),
    'answered', (
      select count(*) from public.responses r
      join public.attempt_modules am on am.id = r.attempt_module_id
      join public.attempts a on a.id = am.attempt_id
      where a.user_id = (select id from me) and r.answer is not null and a.status in ('in_progress', 'completed')
    ),
    'bestScore', (
      select max(scaled_score) from public.attempts
      where user_id = (select id from me) and subject = p_subject and mode = 'timed' and status = 'completed'
    ),
    'rank', 1 + (select count(*) from totals where seconds > coalesce((select seconds from mine), 0)),
    'students', (select count(*) from totals)
  );
$$;

revoke all on function private.attempt_seconds(uuid) from public, anon, authenticated;
revoke all on function public.get_my_banner(text) from public, anon;
grant execute on function public.get_my_banner(text) to authenticated;
