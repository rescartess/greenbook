-- 0025 Leaderboard and student profiles (owner request, 27 Nov 2026).
-- Students see who is ahead (by time practicing, the same ranking as the dashboard banner in 0021)
-- and can open anyone's profile: name, photo, bio, joined, time practicing, questions answered,
-- best full-test score. Read only. Never email, role, colors or answers. Admins are not listed.

-- Every student's totals, once, for the two functions below.
create or replace function private.student_totals(p_subject text)
returns table (id uuid, seconds integer, answered integer, best_score integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    coalesce((
      select sum(private.attempt_seconds(a.id)) from public.attempts a
      where a.user_id = p.id and a.status in ('in_progress', 'completed')
    ), 0)::integer,
    (
      select count(*) from public.responses r
      join public.attempt_modules am on am.id = r.attempt_module_id
      join public.attempts a on a.id = am.attempt_id
      where a.user_id = p.id and r.answer is not null and a.status in ('in_progress', 'completed')
    )::integer,
    (
      select max(a.scaled_score) from public.attempts a
      where a.user_id = p.id and a.subject = p_subject and a.mode = 'timed' and a.status = 'completed'
    )
  from public.profiles p
  where p.role = 'student' or p.id = (select auth.uid());
$$;

-- The top students, best first, plus the caller's own row even when it is further down.
create or replace function public.list_leaderboard(p_subject text, p_limit integer default 50)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with t as (select * from private.student_totals(p_subject)),
  ranked as (
    select t.*, 1 + (select count(*) from t t2 where t2.seconds > t.seconds) as rank,
      row_number() over (order by t.seconds desc, t.id) as pos
    from t
  )
  select jsonb_build_object(
    'students', (select count(*) from t),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'rank', r.rank,
        'name', coalesce(nullif(btrim(p.display_name), ''), 'Student'),
        'avatar', p.avatar_path,
        'seconds', r.seconds,
        'answered', r.answered,
        'bestScore', r.best_score,
        'me', r.id = (select auth.uid())
      ) order by r.pos)
      from ranked r join public.profiles p on p.id = r.id
      where r.pos <= least(greatest(p_limit, 1), 200) or r.id = (select auth.uid())
    ), '[]'::jsonb)
  );
$$;

-- One student's public profile; null for anyone who is not a student (or not there).
create or replace function public.get_student_profile(p_user uuid, p_subject text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with t as (select * from private.student_totals(p_subject)),
  me as (select * from t where t.id = p_user)
  select case when not exists (select 1 from me) then null else jsonb_build_object(
    'id', p.id,
    'name', coalesce(nullif(btrim(p.display_name), ''), 'Student'),
    'avatar', p.avatar_path,
    'bio', p.bio,
    'joined', p.created_at,
    'seconds', (select seconds from me),
    'answered', (select answered from me),
    'bestScore', (select best_score from me),
    'rank', 1 + (select count(*) from t where t.seconds > (select seconds from me)),
    'students', (select count(*) from t),
    'me', p.id = (select auth.uid())
  ) end
  from public.profiles p where p.id = p_user;
$$;

revoke all on function private.student_totals(text) from public, anon, authenticated;
revoke all on function public.list_leaderboard(text, integer) from public, anon;
revoke all on function public.get_student_profile(uuid, text) from public, anon;
grant execute on function public.list_leaderboard(text, integer) to authenticated;
grant execute on function public.get_student_profile(uuid, text) to authenticated;
