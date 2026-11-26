-- 0019 Practice names and the new Results page (owner request, 26 Nov 2026).
--
-- 1. Students name a topic practice when they start it, so they can find it again in Results.
--    attempts.name is optional (old attempts have none; full tests use the test's title).
-- 2. start_topic_practice gains a 7th argument, p_name. The 6-argument version stays (add before remove).
-- 3. list_my_attempts(subject): every finished or unfinished test and practice of the signed-in
--    student, newest first, with counts per module. Correct counts are given only for finished
--    attempts, so nothing about an unfinished test's answers is revealed.

alter table public.attempts
  add column name text check (name is null or char_length(name) between 1 and 60);

create or replace function public.start_topic_practice(
  p_set_id uuid, p_difficulty text, p_from integer, p_count integer, p_check_mode text, p_minutes integer, p_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), '');
  v_attempt uuid;
begin
  if v_name is not null and char_length(v_name) > 60 then
    raise exception 'Use 60 characters or fewer for the name.' using errcode = '22023';
  end if;
  v_attempt := public.start_topic_practice(p_set_id, p_difficulty, p_from, p_count, p_check_mode, p_minutes);
  update public.attempts set name = v_name where id = v_attempt;
  return v_attempt;
end;
$$;

create or replace function public.list_my_attempts(p_subject text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(item order by (item ->> 'startedAt') desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', a.id,
      'setId', a.set_id,
      'setTitle', s.title,
      'setKind', s.kind,
      'name', a.name,
      'mode', a.mode,
      'status', a.status,
      'checkMode', a.check_mode,
      'options', a.options,
      'startedAt', a.started_at,
      'finishedAt', a.finished_at,
      'scaledScore', case when a.status = 'completed' then a.scaled_score end,
      'rawCorrect', case when a.status = 'completed' then a.raw_correct end,
      'modules', coalesce((
        select jsonb_agg(jsonb_build_object(
          'number', m.module_number,
          'tier', m.tier,
          'total', cardinality(am.question_ids),
          'answered', (select count(*) from public.responses r where r.attempt_module_id = am.id and r.answer is not null),
          'correct', case when a.status = 'completed'
            then (select count(*) from public.responses r where r.attempt_module_id = am.id and r.is_correct) end
        ) order by coalesce(m.module_number, 1), am.started_at)
        from public.attempt_modules am
        left join public.modules m on m.id = am.module_id
        where am.attempt_id = a.id
      ), '[]'::jsonb)
    ) as item
    from public.attempts a
    join public.question_sets s on s.id = a.set_id
    where a.user_id = (select auth.uid())
      and a.subject = p_subject
      and a.kind = 'set'
      and a.status in ('in_progress', 'completed')
  ) rows;
$$;

revoke all on function public.start_topic_practice(uuid, text, integer, integer, text, integer, text) from public, anon;
revoke all on function public.list_my_attempts(text) from public, anon;
grant execute on function public.start_topic_practice(uuid, text, integer, integer, text, integer, text) to authenticated;
grant execute on function public.list_my_attempts(text) to authenticated;
