-- 0026 Admin: students (owner request, 27 Nov 2026).
-- The owner sees every account with its numbers, and one page per student: profile, time,
-- answers, accuracy, best scores per subject, the last 30 days, weak topics and recent work.
-- Admin only: both functions refuse anyone else. Read only. Answers to questions are never sent.

-- How someone signed in: Google, the class code (a password made from email + code), or the emailed link.
create or replace function private.sign_in_method(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'google'
      or u.raw_app_meta_data ->> 'provider' = 'google' then 'google'
    when u.encrypted_password is not null and u.encrypted_password <> '' then 'code'
    else 'email'
  end
  from auth.users u where u.id = p_user;
$$;

-- Every account's numbers, for the list and the totals.
create or replace function private.admin_student_rows()
returns table (
  id uuid, name text, email text, avatar text, role text, joined timestamptz, last_active timestamptz,
  seconds integer, answered integer, correct integer, finished integer, best_english integer, best_math integer,
  via text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    coalesce(nullif(btrim(p.display_name), ''), split_part(u.email, '@', 1), 'Student'),
    u.email,
    p.avatar_path,
    p.role,
    p.created_at,
    greatest(
      u.last_sign_in_at,
      (select max(a.started_at) from public.attempts a where a.user_id = p.id),
      (select max(r.updated_at) from public.responses r
        join public.attempt_modules am on am.id = r.attempt_module_id
        join public.attempts a on a.id = am.attempt_id
        where a.user_id = p.id)
    ),
    coalesce((select sum(private.attempt_seconds(a.id)) from public.attempts a
      where a.user_id = p.id and a.status in ('in_progress', 'completed')), 0)::integer,
    s.answered::integer,
    s.correct::integer,
    (select count(*) from public.attempts a where a.user_id = p.id and a.status = 'completed')::integer,
    (select max(a.scaled_score) from public.attempts a
      where a.user_id = p.id and a.subject = 'english' and a.mode = 'timed' and a.status = 'completed'),
    (select max(a.scaled_score) from public.attempts a
      where a.user_id = p.id and a.subject = 'math' and a.mode = 'timed' and a.status = 'completed'),
    private.sign_in_method(p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  cross join lateral (
    select count(*) filter (where r.answer is not null) as answered,
           count(*) filter (where r.answer is not null and r.is_correct) as correct
    from public.responses r
    join public.attempt_modules am on am.id = r.attempt_module_id
    join public.attempts a on a.id = am.attempt_id
    where a.user_id = p.id and a.status in ('in_progress', 'completed')
  ) s;
$$;

-- The list: totals on top, then everyone (newest first; the page sorts and searches).
create or replace function public.admin_list_students()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Tashkent')::date;
  result jsonb;
begin
  if not private.is_admin() then
    raise exception 'Only admins can see students' using errcode = '42501';
  end if;

  with rows as (select * from private.admin_student_rows())
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'students', (select count(*) from rows where role = 'student'),
      'newThisWeek', (select count(*) from rows where role = 'student' and joined >= now() - interval '7 days'),
      'activeToday', (select count(*) from rows where role = 'student'
        and (last_active at time zone 'Asia/Tashkent')::date = today),
      'activeWeek', (select count(*) from rows where role = 'student' and last_active >= now() - interval '7 days'),
      'seconds', (select coalesce(sum(seconds), 0) from rows where role = 'student'),
      'answered', (select coalesce(sum(answered), 0) from rows where role = 'student')
    ),
    'rows', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'email', email, 'avatar', avatar, 'role', role,
      'joined', joined, 'lastActive', last_active,
      'seconds', seconds, 'answered', answered, 'correct', correct, 'finished', finished,
      'bestEnglish', best_english, 'bestMath', best_math, 'via', via
    ) order by joined desc) from rows), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

-- One student's page. Null when there is no such account.
create or replace function public.admin_get_student(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Tashkent')::date;
  result jsonb;
begin
  if not private.is_admin() then
    raise exception 'Only admins can see students' using errcode = '42501';
  end if;

  with everyone as (select * from private.admin_student_rows()),
  me as (select * from everyone where id = p_user),
  tries as (
    select a.*, private.attempt_seconds(a.id) as secs, qs.title as set_title, qs.kind as set_kind,
      (select count(*) from public.responses r join public.attempt_modules am on am.id = r.attempt_module_id
        where am.attempt_id = a.id and r.answer is not null) as answered,
      (select count(*) from public.responses r join public.attempt_modules am on am.id = r.attempt_module_id
        where am.attempt_id = a.id and r.answer is not null and r.is_correct) as correct,
      (select coalesce(sum(cardinality(am.question_ids)), 0) from public.attempt_modules am where am.attempt_id = a.id) as total
    from public.attempts a
    left join public.question_sets qs on qs.id = a.set_id
    where a.user_id = p_user
  ),
  answers as (
    select q.subject, sk.name as skill, r.is_correct
    from public.responses r
    join public.attempt_modules am on am.id = r.attempt_module_id
    join public.attempts a on a.id = am.attempt_id
    join public.questions q on q.id = r.question_id
    left join public.skills sk on sk.id = q.skill_id
    where a.user_id = p_user and r.answer is not null and a.status in ('in_progress', 'completed')
  )
  select case when not exists (select 1 from me) then null else jsonb_build_object(
    'id', me.id,
    'name', me.name,
    'email', me.email,
    'avatar', me.avatar,
    'role', me.role,
    'via', me.via,
    'bio', p.bio,
    'targetScore', p.target_score,
    'testDate', p.test_date,
    'joined', me.joined,
    'lastActive', me.last_active,
    'seconds', me.seconds,
    'answered', me.answered,
    'correct', me.correct,
    'finished', me.finished,
    'started', (select count(*) from tries),
    'rank', case when me.role = 'student'
      then 1 + (select count(*) from everyone e where e.role = 'student' and e.seconds > me.seconds) end,
    'students', (select count(*) from everyone where role = 'student'),
    'subjects', (select jsonb_agg(jsonb_build_object(
        'subject', s.subject,
        'seconds', coalesce((select sum(secs) from tries t where t.subject = s.subject and t.status in ('in_progress', 'completed')), 0),
        'answered', (select count(*) from answers x where x.subject = s.subject),
        'correct', (select count(*) from answers x where x.subject = s.subject and x.is_correct),
        'best', (select max(scaled_score) from tries t where t.subject = s.subject and t.mode = 'timed' and t.status = 'completed'),
        'latest', (select t.scaled_score from tries t where t.subject = s.subject and t.mode = 'timed' and t.status = 'completed'
          order by t.finished_at desc nulls last limit 1),
        'fullTests', (select count(*) from tries t where t.subject = s.subject and t.mode = 'timed' and t.status = 'completed')
      ) order by s.ord) from (values ('english', 1), ('math', 2)) s(subject, ord)),
    'days', (select jsonb_agg(jsonb_build_object(
        'day', d.day,
        'seconds', coalesce((select sum(secs) from tries t
          where t.status in ('in_progress', 'completed') and (t.started_at at time zone 'Asia/Tashkent')::date = d.day), 0)
      ) order by d.day)
      from (select (today - g)::date as day from generate_series(0, 29) g) d),
    'skills', coalesce((select jsonb_agg(x order by (x ->> 'accuracy')::numeric, (x ->> 'answered')::int desc) from (
        select jsonb_build_object('subject', subject, 'skill', skill, 'answered', count(*),
          'correct', count(*) filter (where is_correct),
          'accuracy', round(count(*) filter (where is_correct)::numeric / count(*), 3)) x
        from answers where skill is not null group by subject, skill having count(*) >= 3
      ) w), '[]'::jsonb),
    'attempts', coalesce((select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'title', coalesce(t.name, t.set_title, case when t.kind = 'mistakes_review' then 'Mistakes review' else 'Practice' end),
        'kind', case when t.kind = 'mistakes_review' then 'mistakes' when t.set_kind = 'full_test' then 'full'
          when t.set_kind = 'monthly' then 'monthly' else 'topic' end,
        'subject', t.subject,
        'mode', t.mode,
        'status', t.status,
        'started', t.started_at,
        'finished', t.finished_at,
        'seconds', t.secs,
        'answered', t.answered,
        'correct', t.correct,
        'total', t.total,
        'score', t.scaled_score
      ) order by t.started_at desc) from (select * from tries order by started_at desc limit 60) t), '[]'::jsonb)
  ) end
  into result
  from me join public.profiles p on p.id = me.id;
  return result;
end;
$$;

revoke all on function private.sign_in_method(uuid) from public, anon, authenticated;
revoke all on function private.admin_student_rows() from public, anon, authenticated;
revoke all on function public.admin_list_students() from public, anon;
revoke all on function public.admin_get_student(uuid) from public, anon;
grant execute on function public.admin_list_students() to authenticated;
grant execute on function public.admin_get_student(uuid) to authenticated;
