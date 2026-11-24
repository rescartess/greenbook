-- 0010 Practice (topic and monthly sets) and mistake review.
-- Practice is untimed and checks each answer right away. To keep full-test answers
-- safe, practice only grades questions from published topic/monthly sets, and mistake
-- review only grades questions the student has already answered wrong.

-- Shared: remember one result for the Mistakes page.
create or replace function private.record_progress(p_user uuid, p_question uuid, p_correct boolean)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.question_progress as p (user_id, question_id, times_seen, times_wrong, last_result, correct_streak, last_seen_at, mastered)
  values (p_user, p_question, 1, case when p_correct then 0 else 1 end,
          case when p_correct then 'correct' else 'wrong' end, case when p_correct then 1 else 0 end, now(), false)
  on conflict (user_id, question_id) do update set
    times_seen = p.times_seen + 1,
    times_wrong = p.times_wrong + excluded.times_wrong,
    last_result = excluded.last_result,
    correct_streak = case when p_correct then p.correct_streak + 1 else 0 end,
    last_seen_at = now(),
    mastered = case when p_correct then p.mastered or (p.times_wrong > 0 and p.correct_streak + 1 >= 2) else false end;
$$;

-- Feedback for one checked question (only ever for a question the student has answered).
create or replace function private.feedback(p_question uuid, p_answer text, p_correct boolean)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('answer', p_answer, 'isCorrect', p_correct, 'correctAnswer', qa.correct_answer, 'explanation', qa.explanation)
  from public.question_answers qa where qa.question_id = p_question;
$$;

-- Starts (or resumes) practice on a published topic or monthly set.
create or replace function public.start_practice(p_set_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_set public.question_sets;
  v_attempt uuid;
  v_ids uuid[];
begin
  if v_user is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  select * into v_set from public.question_sets
  where id = p_set_id and kind in ('topic', 'monthly') and (published or (select private.is_admin()));
  if v_set.id is null then
    raise exception 'This practice set isn’t available.' using errcode = 'P0002';
  end if;

  select a.id into v_attempt from public.attempts a
  where a.user_id = v_user and a.set_id = p_set_id and a.status = 'in_progress' and a.mode = 'practice'
  order by a.started_at desc limit 1;
  if v_attempt is not null then
    return v_attempt;
  end if;

  select array_agg(mq.question_id order by m.sort_order, mq.position) into v_ids
  from public.modules m join public.module_questions mq on mq.module_id = m.id
  where m.set_id = p_set_id;
  if v_ids is null then
    raise exception 'This practice set has no questions yet.' using errcode = 'P0002';
  end if;

  insert into public.attempts (user_id, set_id, subject, mode) values (v_user, p_set_id, v_set.subject, 'practice')
  returning id into v_attempt;
  insert into public.attempt_modules (attempt_id, module_id, question_ids) values (v_attempt, null, v_ids);
  return v_attempt;
end;
$$;

-- The practice screen: all questions, and feedback for the ones already checked.
create or replace function public.get_practice_state(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts;
  v_am public.attempt_modules;
begin
  select * into v_attempt from public.attempts
  where id = p_attempt_id and mode = 'practice' and (user_id = (select auth.uid()) or (select private.is_admin()));
  if v_attempt.id is null then
    raise exception 'This practice isn’t yours.' using errcode = '42501';
  end if;
  select * into v_am from public.attempt_modules where attempt_id = v_attempt.id order by started_at limit 1;

  return jsonb_build_object(
    'attemptId', v_attempt.id,
    'attemptModuleId', v_am.id,
    'status', v_attempt.status,
    'title', (select title from public.question_sets where id = v_attempt.set_id),
    'subject', v_attempt.subject,
    'questions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', q.id, 'position', ord.n, 'type', q.type, 'passage', q.passage, 'prompt', q.prompt, 'choices', q.choices,
        'skill', s.name,
        'feedback', case when r.is_correct is null then null else private.feedback(q.id, r.answer, r.is_correct) end
      ) order by ord.n), '[]'::jsonb)
      from unnest(v_am.question_ids) with ordinality as ord(question_id, n)
      join public.questions q on q.id = ord.question_id
      left join public.skills s on s.id = q.skill_id
      left join public.responses r on r.attempt_module_id = v_am.id and r.question_id = q.id
    )
  );
end;
$$;

-- Checks one practice answer right away. A question can be checked once per practice.
create or replace function public.check_practice_answer(p_attempt_module_id uuid, p_question_id uuid, p_answer text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_am public.attempt_modules;
  v_attempt public.attempts;
  v_existing public.responses;
  v_correct boolean;
begin
  v_am := private.own_attempt_module(p_attempt_module_id);
  if v_am.id is null then
    raise exception 'This practice isn’t yours.' using errcode = '42501';
  end if;
  select * into v_attempt from public.attempts where id = v_am.attempt_id;
  if v_attempt.mode <> 'practice' or v_attempt.status <> 'in_progress' then
    raise exception 'This practice is already finished.' using errcode = 'P0003';
  end if;
  if not (p_question_id = any (v_am.question_ids)) then
    raise exception 'That question isn’t in this practice.' using errcode = 'P0005';
  end if;
  if coalesce(trim(p_answer), '') = '' or length(p_answer) > 20 then
    raise exception 'Pick an answer first.' using errcode = '22023';
  end if;

  select * into v_existing from public.responses where attempt_module_id = v_am.id and question_id = p_question_id;
  if v_existing.is_correct is not null then
    return private.feedback(p_question_id, v_existing.answer, v_existing.is_correct);
  end if;

  select private.answer_matches(p_answer, qa.correct_answer, qa.accepted_answers) into v_correct
  from public.question_answers qa where qa.question_id = p_question_id;
  v_correct := coalesce(v_correct, false);

  insert into public.responses (attempt_module_id, question_id, question_version, answer, is_correct)
  values (v_am.id, p_question_id, (select version from public.questions where id = p_question_id), trim(p_answer), v_correct)
  on conflict (attempt_module_id, question_id) do update set answer = excluded.answer, is_correct = excluded.is_correct, updated_at = now();

  perform private.record_progress(v_attempt.user_id, p_question_id, v_correct);
  return private.feedback(p_question_id, trim(p_answer), v_correct);
end;
$$;

-- Ends a practice session and stores the number right.
create or replace function public.finish_practice(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts;
  v_correct integer;
begin
  select * into v_attempt from public.attempts
  where id = p_attempt_id and mode = 'practice' and user_id = (select auth.uid());
  if v_attempt.id is null then
    raise exception 'This practice isn’t yours.' using errcode = '42501';
  end if;
  if v_attempt.status <> 'in_progress' then
    return;
  end if;
  select count(*) filter (where r.is_correct) into v_correct
  from public.attempt_modules am join public.responses r on r.attempt_module_id = am.id
  where am.attempt_id = v_attempt.id;
  update public.attempt_modules set submitted_at = now(), correct_count = v_correct where attempt_id = v_attempt.id;
  update public.attempts set status = 'completed', finished_at = now(), raw_correct = v_correct where id = v_attempt.id;
end;
$$;

-- The student's open mistakes in one subject, with the explanation (they've already seen the answer).
create or replace function public.get_mistakes(p_subject text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id, 'passage', q.passage, 'prompt', q.prompt, 'choices', q.choices, 'type', q.type,
    'skill', coalesce(s.name, 'Other'), 'domain', coalesce(d.name, 'Other'), 'difficulty', q.difficulty,
    'timesWrong', p.times_wrong, 'streak', p.correct_streak, 'lastSeenAt', p.last_seen_at,
    'correctAnswer', qa.correct_answer, 'explanation', qa.explanation
  ) order by d.sort_order nulls last, s.sort_order nulls last, p.last_seen_at desc), '[]'::jsonb)
  from public.question_progress p
  join public.questions q on q.id = p.question_id and q.status <> 'retired' and q.subject = p_subject
  left join public.question_answers qa on qa.question_id = q.id
  left join public.skills s on s.id = q.skill_id
  left join public.domains d on d.id = s.domain_id
  where p.user_id = (select auth.uid()) and p.times_wrong > 0 and not p.mastered;
$$;

-- Tries a mistake again. Two right in a row clears it from the list.
create or replace function public.retry_mistake(p_question_id uuid, p_answer text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_correct boolean;
  v_progress public.question_progress;
begin
  select * into v_progress from public.question_progress where user_id = v_user and question_id = p_question_id;
  if v_progress.user_id is null or v_progress.times_wrong = 0 then
    raise exception 'That question isn’t in your mistakes.' using errcode = '42501';
  end if;
  if coalesce(trim(p_answer), '') = '' or length(p_answer) > 20 then
    raise exception 'Pick an answer first.' using errcode = '22023';
  end if;
  select private.answer_matches(p_answer, qa.correct_answer, qa.accepted_answers) into v_correct
  from public.question_answers qa where qa.question_id = p_question_id;
  v_correct := coalesce(v_correct, false);
  perform private.record_progress(v_user, p_question_id, v_correct);
  select * into v_progress from public.question_progress where user_id = v_user and question_id = p_question_id;
  return private.feedback(p_question_id, trim(p_answer), v_correct)
    || jsonb_build_object('mastered', v_progress.mastered, 'streak', v_progress.correct_streak);
end;
$$;

-- Creating topic and monthly sets from the admin area (admin rules apply: security invoker).
create or replace function public.admin_create_set(p_kind text, p_title text, p_subject text, p_skill_id integer, p_month date)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_set uuid;
begin
  if p_kind not in ('topic', 'monthly') then
    raise exception 'Use admin_create_test for full tests.' using errcode = '22023';
  end if;
  if coalesce(trim(p_title), '') = '' then
    raise exception 'Give the set a name.' using errcode = '22023';
  end if;
  insert into public.question_sets (kind, title, subject, skill_id, month, is_adaptive, published)
  values (p_kind, trim(p_title), p_subject, p_skill_id, case when p_kind = 'monthly' then date_trunc('month', p_month)::date end, false, false)
  returning id into v_set;
  insert into public.modules (set_id, module_number, tier, time_limit_sec, sort_order) values (v_set, 1, 'standard', null, 1);
  return v_set;
end;
$$;

revoke all on function private.record_progress(uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function private.feedback(uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.start_practice(uuid) from public, anon;
revoke all on function public.get_practice_state(uuid) from public, anon;
revoke all on function public.check_practice_answer(uuid, uuid, text) from public, anon;
revoke all on function public.finish_practice(uuid) from public, anon;
revoke all on function public.get_mistakes(text) from public, anon;
revoke all on function public.retry_mistake(uuid, text) from public, anon;
revoke all on function public.admin_create_set(text, text, text, integer, date) from public, anon;
grant execute on function public.start_practice(uuid) to authenticated;
grant execute on function public.get_practice_state(uuid) to authenticated;
grant execute on function public.check_practice_answer(uuid, uuid, text) to authenticated;
grant execute on function public.finish_practice(uuid) to authenticated;
grant execute on function public.get_mistakes(text) to authenticated;
grant execute on function public.retry_mistake(uuid, text) to authenticated;
grant execute on function public.admin_create_set(text, text, text, integer, date) to authenticated;
