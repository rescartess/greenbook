-- 0027 Rankings by correct answers, per subject (owner request, 28 Nov 2026).
-- The leaderboard, the student profiles and the dashboard banner rank students by how many
-- questions they have answered correctly in that subject: English pages by English questions,
-- Math pages by Math questions. Each question counts once (getting the same question right again
-- in a retake doesn't add to it), over everything: full tests, topic practice, month practice.
-- Only graded answers count, so a running test's module adds nothing until it ends.
-- Ties share a rank; among them, more time practicing comes first. Admins are still not listed.

create or replace function private.subject_standings(p_subject text)
returns table (id uuid, correct integer, seconds integer, answered integer, best_score integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    (
      select count(distinct r.question_id) from public.responses r
      join public.attempt_modules am on am.id = r.attempt_module_id
      join public.attempts a on a.id = am.attempt_id
      where a.user_id = p.id and a.subject = p_subject and r.is_correct
        and a.status in ('in_progress', 'completed')
    )::integer,
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

-- The top students, most correct first, plus the caller's own row even when it is further down.
create or replace function public.list_leaderboard(p_subject text, p_limit integer default 50)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with t as (select * from private.subject_standings(p_subject)),
  ranked as (
    select t.*, 1 + (select count(*) from t t2 where t2.correct > t.correct) as rank,
      row_number() over (order by t.correct desc, t.seconds desc, t.id) as pos
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
        'correct', r.correct,
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
  with t as (select * from private.subject_standings(p_subject)),
  me as (select * from t where t.id = p_user)
  select case when not exists (select 1 from me) then null else jsonb_build_object(
    'id', p.id,
    'name', coalesce(nullif(btrim(p.display_name), ''), 'Student'),
    'avatar', p.avatar_path,
    'bio', p.bio,
    'joined', p.created_at,
    'correct', (select correct from me),
    'seconds', (select seconds from me),
    'answered', (select answered from me),
    'bestScore', (select best_score from me),
    'rank', 1 + (select count(*) from t where t.correct > (select correct from me)),
    'students', (select count(*) from t),
    'me', p.id = (select auth.uid())
  ) end
  from public.profiles p where p.id = p_user;
$$;

-- The dashboard banner: same numbers as before, ranked by correct answers in the subject.
create or replace function public.get_my_banner(p_subject text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with t as (select * from private.subject_standings(p_subject)),
  me as (select * from t where t.id = (select auth.uid()))
  select jsonb_build_object(
    'joined', (select created_at from public.profiles where id = (select auth.uid())),
    'bio', (select bio from public.profiles where id = (select auth.uid())),
    'correct', coalesce((select correct from me), 0),
    'seconds', coalesce((select seconds from me), 0),
    'answered', coalesce((select answered from me), 0),
    'bestScore', (select best_score from me),
    'rank', 1 + (select count(*) from t where t.correct > coalesce((select correct from me), 0)),
    'students', (select count(*) from t)
  );
$$;

-- private.student_totals (0025, by time) is no longer used; it is left in place (add before you
-- remove) and can be dropped in a later migration.

revoke all on function private.subject_standings(text) from public, anon, authenticated;
revoke all on function public.list_leaderboard(text, integer) from public, anon;
revoke all on function public.get_student_profile(uuid, text) from public, anon;
revoke all on function public.get_my_banner(text) from public, anon;
grant execute on function public.list_leaderboard(text, integer) to authenticated;
grant execute on function public.get_student_profile(uuid, text) to authenticated;
grant execute on function public.get_my_banner(text) to authenticated;
