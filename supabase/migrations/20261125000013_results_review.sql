-- 0013 Results and review improvements (owner request, 25 Nov 2026).
-- get_test_results also returns each question's Mark for Review flag, its type and when the test started.
-- start_topic_practice allows up to 600 questions, so a student can do a whole topic in one go.
-- remove_attempt lets a student delete one of their finished tests ("Delete this attempt" on the results page);
-- it is marked abandoned, so it leaves results, the dashboard and the score trend.

create or replace function public.get_test_results(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts;
begin
  select * into v_attempt from public.attempts
  where id = p_attempt_id and (user_id = (select auth.uid()) or (select private.is_admin()));
  if v_attempt.id is null then
    raise exception 'This test isn’t yours.' using errcode = '42501';
  end if;
  if v_attempt.status <> 'completed' then
    raise exception 'Finish the test to see results.' using errcode = 'P0006';
  end if;

  return jsonb_build_object(
    'attemptId', v_attempt.id,
    'title', (select title from public.question_sets where id = v_attempt.set_id),
    'setId', v_attempt.set_id,
    'subject', v_attempt.subject,
    'finishedAt', v_attempt.finished_at,
    'startedAt', v_attempt.started_at,
    'rawCorrect', v_attempt.raw_correct,
    'scaledScore', v_attempt.scaled_score,
    'modules', (
      select jsonb_agg(jsonb_build_object(
        'number', m.module_number,
        'tier', m.tier,
        'correct', am.correct_count,
        'total', array_length(am.question_ids, 1),
        'questions', (
          select jsonb_agg(jsonb_build_object(
            'id', q.id,
            'position', ord.n,
            'passage', q.passage,
            'prompt', q.prompt,
            'choices', q.choices,
            'skill', s.name,
            'domain', d.name,
            'difficulty', q.difficulty,
            'answer', r.answer,
            'isCorrect', coalesce(r.is_correct, false),
            'correctAnswer', qa.correct_answer,
            'explanation', qa.explanation,
            'seconds', coalesce(r.time_spent_sec, 0),
            'marked', coalesce(r.marked_for_review, false),
            'type', q.type
          ) order by ord.n)
          from unnest(am.question_ids) with ordinality as ord(question_id, n)
          join public.questions q on q.id = ord.question_id
          left join public.question_answers qa on qa.question_id = q.id
          left join public.responses r on r.attempt_module_id = am.id and r.question_id = q.id
          left join public.skills s on s.id = q.skill_id
          left join public.domains d on d.id = s.domain_id
        )
      ) order by m.module_number)
      from public.attempt_modules am
      join public.modules m on m.id = am.module_id
      where am.attempt_id = v_attempt.id
    )
  );
end;
$$;

create or replace function public.start_topic_practice(
  p_set_id uuid, p_difficulty text, p_from integer, p_count integer, p_check_mode text, p_minutes integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_set public.question_sets;
  v_ids uuid[];
  v_attempt uuid;
begin
  if v_user is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  select * into v_set from public.question_sets
  where id = p_set_id and kind in ('topic', 'monthly') and (published or (select private.is_admin()));
  if v_set.id is null then
    raise exception 'This topic isn’t available.' using errcode = 'P0002';
  end if;
  if p_difficulty is null or p_difficulty not in ('all', 'easy', 'medium', 'hard') then
    raise exception 'Pick a difficulty.' using errcode = '22023';
  end if;
  if p_check_mode is null or p_check_mode not in ('each', 'end') then
    raise exception 'Pick when to check answers.' using errcode = '22023';
  end if;
  if p_from is null or p_from < 1 or p_count is null or p_count < 1 or p_count > 600 then
    raise exception 'Pick between 1 and 600 questions.' using errcode = '22023';
  end if;
  if p_minutes is not null and (p_minutes < 1 or p_minutes > 300) then
    raise exception 'Set the timer between 1 and 300 minutes.' using errcode = '22023';
  end if;

  select array_agg(i.question_id order by i.n) into v_ids
  from private.topic_items(p_set_id, p_difficulty) i
  where i.n >= p_from and i.n < p_from + p_count;
  if v_ids is null then
    raise exception 'There are no questions in that range.' using errcode = 'P0002';
  end if;

  insert into public.attempts (user_id, set_id, subject, mode, check_mode, options)
  values (v_user, p_set_id, v_set.subject, 'practice', p_check_mode, jsonb_build_object(
    'difficulty', p_difficulty, 'from', p_from, 'to', p_from + cardinality(v_ids) - 1, 'minutes', p_minutes
  ))
  returning id into v_attempt;
  insert into public.attempt_modules (attempt_id, module_id, question_ids, deadline_at)
  values (v_attempt, null, v_ids, case when p_minutes is not null then now() + make_interval(mins => p_minutes) end);
  return v_attempt;
end;
$$;

create or replace function public.remove_attempt(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.attempts
  set status = 'abandoned'
  where id = p_attempt_id and user_id = (select auth.uid()) and status = 'completed';
  if not found then
    raise exception 'This attempt isn’t yours or was already removed.' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.remove_attempt(uuid) from public, anon;
grant execute on function public.remove_attempt(uuid) to authenticated;
