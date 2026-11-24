-- 0007 Test engine: starting a test, saving answers, finishing modules, scoring.
--
-- Students can only read their own activity (0003). Everything that writes it
-- happens here, in functions that check who is asking. Correct answers never
-- leave the database while a module is running; the server keeps the clock.

-- How many module 1 answers must be right to get the harder module 2.
-- Empty = 60% of module 1's questions, rounded up.
alter table public.question_sets add column route_threshold smallint check (route_threshold >= 0);

-- ---------- helpers (private: not callable from the website) ----------

create or replace function private.answer_matches(given text, correct text, accepted text[])
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  g text := lower(regexp_replace(coalesce(given, ''), '\s+', '', 'g'));
  candidate text;
  g_num numeric;
  c_num numeric;
begin
  if g = '' then
    return false;
  end if;
  foreach candidate in array array_prepend(correct, coalesce(accepted, '{}')) loop
    candidate := lower(regexp_replace(coalesce(candidate, ''), '\s+', '', 'g'));
    if candidate = g then
      return true;
    end if;
    g_num := private.to_number(g);
    c_num := private.to_number(candidate);
    if g_num is not null and c_num is not null and abs(g_num - c_num) < 0.0005 then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

-- "3/4" -> 0.75, "-.5" -> -0.5, anything else -> null.
create or replace function private.to_number(value text)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
declare
  parts text[];
begin
  if value ~ '^-?\d*\.?\d+$' then
    return value::numeric;
  end if;
  if value ~ '^-?\d+/\d+$' then
    parts := regexp_split_to_array(value, '/');
    if parts[2]::numeric = 0 then
      return null;
    end if;
    return parts[1]::numeric / parts[2]::numeric;
  end if;
  return null;
end;
$$;

-- The attempt module, if it belongs to the caller (admins may open any).
create or replace function private.own_attempt_module(p_attempt_module_id uuid)
returns public.attempt_modules
language sql
stable
security definer
set search_path = ''
as $$
  select am.*
  from public.attempt_modules am
  join public.attempts a on a.id = am.attempt_id
  where am.id = p_attempt_module_id
    and (a.user_id = (select auth.uid()) or (select private.is_admin()));
$$;

-- Opens a module for an attempt: fixes its question order and its deadline.
create or replace function private.open_module(p_attempt_id uuid, p_module_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_limit integer;
  v_id uuid;
begin
  select array_agg(mq.question_id order by mq.position), max(m.time_limit_sec)
    into v_ids, v_limit
  from public.modules m
  join public.module_questions mq on mq.module_id = m.id
  where m.id = p_module_id;

  if v_ids is null then
    raise exception 'This module has no questions.' using errcode = 'P0001';
  end if;

  insert into public.attempt_modules (attempt_id, module_id, question_ids, started_at, deadline_at)
  values (p_attempt_id, p_module_id, v_ids, now(), case when v_limit is null then null else now() + make_interval(secs => v_limit) end)
  returning id into v_id;
  return v_id;
end;
$$;

-- Grades a module, records progress, then opens module 2 or finishes the attempt.
create or replace function private.close_module(p_attempt_module_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_am public.attempt_modules;
  v_attempt public.attempts;
  v_module public.modules;
  v_set public.question_sets;
  v_correct integer;
  v_threshold integer;
  v_next uuid;
  v_raw integer;
  v_tier text;
begin
  select * into v_am from public.attempt_modules where id = p_attempt_module_id for update;
  if v_am.submitted_at is not null then
    return;
  end if;
  select * into v_attempt from public.attempts where id = v_am.attempt_id;
  select * into v_module from public.modules where id = v_am.module_id;
  select * into v_set from public.question_sets where id = v_attempt.set_id;

  -- Every question gets a response row, so unanswered ones count as wrong.
  insert into public.responses (attempt_module_id, question_id, question_version)
  select v_am.id, q.id, q.version
  from public.questions q
  where q.id = any (v_am.question_ids)
  on conflict (attempt_module_id, question_id) do nothing;

  update public.responses r
  set is_correct = private.answer_matches(r.answer, qa.correct_answer, qa.accepted_answers)
  from public.question_answers qa
  where r.attempt_module_id = v_am.id and qa.question_id = r.question_id;

  update public.responses set is_correct = false where attempt_module_id = v_am.id and is_correct is null;

  select count(*) filter (where is_correct) into v_correct from public.responses where attempt_module_id = v_am.id;
  update public.attempt_modules set submitted_at = now(), correct_count = v_correct where id = v_am.id;

  -- Progress for the Mistakes page.
  insert into public.question_progress as p (user_id, question_id, times_seen, times_wrong, last_result, correct_streak, last_seen_at, mastered)
  select v_attempt.user_id, r.question_id, 1, case when r.is_correct then 0 else 1 end,
         case when r.is_correct then 'correct' else 'wrong' end,
         case when r.is_correct then 1 else 0 end, now(), false
  from public.responses r
  where r.attempt_module_id = v_am.id
  on conflict (user_id, question_id) do update set
    times_seen = p.times_seen + 1,
    times_wrong = p.times_wrong + excluded.times_wrong,
    last_result = excluded.last_result,
    correct_streak = case when excluded.last_result = 'correct' then p.correct_streak + 1 else 0 end,
    last_seen_at = now(),
    mastered = case when excluded.last_result = 'correct' then p.mastered or (p.times_wrong > 0 and p.correct_streak + 1 >= 2) else false end;

  if v_module.module_number = 1 then
    v_threshold := coalesce(v_set.route_threshold, ceil(array_length(v_am.question_ids, 1) * 0.6)::integer);
    v_tier := case when v_correct >= v_threshold then 'harder' else 'easier' end;

    select m.id into v_next
    from public.modules m
    where m.set_id = v_set.id and m.module_number = 2
    order by (m.tier = v_tier) desc, (m.tier = 'standard') desc, m.sort_order
    limit 1;

    if v_next is not null then
      perform private.open_module(v_attempt.id, v_next);
      return;
    end if;
  end if;

  -- Last module: total score.
  select coalesce(sum(am.correct_count), 0) into v_raw
  from public.attempt_modules am where am.attempt_id = v_attempt.id;

  select m.tier into v_tier
  from public.attempt_modules am join public.modules m on m.id = am.module_id
  where am.attempt_id = v_attempt.id and m.module_number = 2
  limit 1;

  update public.attempts
  set status = 'completed',
      finished_at = now(),
      raw_correct = v_raw,
      scaled_score = (
        select st.scaled_score from public.score_tables st
        where st.subject = v_attempt.subject and st.tier = coalesce(v_tier, 'harder') and st.raw_correct = v_raw
      )
  where id = v_attempt.id;
end;
$$;

-- Closes any running module whose time is up (with 30 seconds' grace for slow networks).
create or replace function private.close_expired(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  loop
    select am.id into v_id
    from public.attempt_modules am
    where am.attempt_id = p_attempt_id and am.submitted_at is null
      and am.deadline_at is not null and am.deadline_at + interval '30 seconds' < now()
    order by am.started_at
    limit 1;
    exit when v_id is null;
    perform private.close_module(v_id);
  end loop;
end;
$$;

-- ---------- what the website calls ----------

-- Starts a full test, or returns the one already in progress.
create or replace function public.start_full_test(p_set_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_set public.question_sets;
  v_attempt uuid;
  v_first uuid;
begin
  if v_user is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;

  select * into v_set from public.question_sets
  where id = p_set_id and kind = 'full_test' and (published or (select private.is_admin()));
  if v_set.id is null then
    raise exception 'This test isn’t available.' using errcode = 'P0002';
  end if;

  select a.id into v_attempt from public.attempts a
  where a.user_id = v_user and a.set_id = p_set_id and a.status = 'in_progress'
  order by a.started_at desc limit 1;
  if v_attempt is not null then
    perform private.close_expired(v_attempt);
    if (select status from public.attempts where id = v_attempt) = 'in_progress' then
      return v_attempt;
    end if;
  end if;

  select m.id into v_first from public.modules m
  where m.set_id = p_set_id and m.module_number = 1
  order by m.sort_order limit 1;
  if v_first is null then
    raise exception 'This test has no module 1.' using errcode = 'P0002';
  end if;

  insert into public.attempts (user_id, set_id, subject, mode)
  values (v_user, p_set_id, v_set.subject, 'timed')
  returning id into v_attempt;
  perform private.open_module(v_attempt, v_first);
  return v_attempt;
end;
$$;

-- Everything the test screen needs for the module in progress. Never includes answers.
create or replace function public.get_test_state(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts;
  v_am public.attempt_modules;
  v_module public.modules;
  v_title text;
  v_count integer;
begin
  select * into v_attempt from public.attempts
  where id = p_attempt_id and (user_id = (select auth.uid()) or (select private.is_admin()));
  if v_attempt.id is null then
    raise exception 'This test isn’t yours.' using errcode = '42501';
  end if;

  perform private.close_expired(v_attempt.id);
  select * into v_attempt from public.attempts where id = p_attempt_id;
  select title into v_title from public.question_sets where id = v_attempt.set_id;

  if v_attempt.status <> 'in_progress' then
    return jsonb_build_object('attemptId', v_attempt.id, 'status', v_attempt.status, 'title', v_title, 'subject', v_attempt.subject);
  end if;

  select * into v_am from public.attempt_modules
  where attempt_id = v_attempt.id and submitted_at is null
  order by started_at desc limit 1;
  select * into v_module from public.modules where id = v_am.module_id;
  select count(*) into v_count from public.attempt_modules where attempt_id = v_attempt.id;

  return jsonb_build_object(
    'attemptId', v_attempt.id,
    'status', v_attempt.status,
    'title', v_title,
    'subject', v_attempt.subject,
    'module', jsonb_build_object(
      'attemptModuleId', v_am.id,
      'number', v_module.module_number,
      'deadlineAt', v_am.deadline_at,
      'serverNow', now(),
      'isLast', v_module.module_number = 2 or not exists (
        select 1 from public.modules m where m.set_id = v_attempt.set_id and m.module_number = 2
      )
    ),
    'questions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', q.id,
        'position', ord.n,
        'type', q.type,
        'passage', q.passage,
        'prompt', q.prompt,
        'choices', q.choices,
        'imagePath', q.image_path
      ) order by ord.n), '[]'::jsonb)
      from unnest(v_am.question_ids) with ordinality as ord(question_id, n)
      join public.questions q on q.id = ord.question_id
    ),
    'responses', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'questionId', r.question_id,
        'answer', r.answer,
        'marked', r.marked_for_review,
        'eliminated', to_jsonb(r.eliminated)
      )), '[]'::jsonb)
      from public.responses r where r.attempt_module_id = v_am.id
    )
  );
end;
$$;

-- Saves one answer (or a mark / crossed-out choices) while the module is running.
create or replace function public.save_response(
  p_attempt_module_id uuid,
  p_question_id uuid,
  p_answer text,
  p_marked boolean,
  p_eliminated text[],
  p_seconds integer default 0
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_am public.attempt_modules;
begin
  v_am := private.own_attempt_module(p_attempt_module_id);
  if v_am.id is null then
    raise exception 'This test isn’t yours.' using errcode = '42501';
  end if;
  if v_am.submitted_at is not null then
    raise exception 'This module is already finished.' using errcode = 'P0003';
  end if;
  if v_am.deadline_at is not null and now() > v_am.deadline_at + interval '30 seconds' then
    raise exception 'Time is up for this module.' using errcode = 'P0004';
  end if;
  if not (p_question_id = any (v_am.question_ids)) then
    raise exception 'That question isn’t in this module.' using errcode = 'P0005';
  end if;
  if length(coalesce(p_answer, '')) > 20 or coalesce(array_length(p_eliminated, 1), 0) > 6 then
    raise exception 'That answer is too long.' using errcode = '22001';
  end if;

  insert into public.responses (attempt_module_id, question_id, question_version, answer, marked_for_review, eliminated, time_spent_sec, updated_at)
  values (
    v_am.id, p_question_id, (select version from public.questions where id = p_question_id),
    nullif(trim(p_answer), ''), coalesce(p_marked, false), coalesce(p_eliminated, '{}'),
    greatest(0, least(coalesce(p_seconds, 0), 600)), now()
  )
  on conflict (attempt_module_id, question_id) do update set
    answer = excluded.answer,
    marked_for_review = excluded.marked_for_review,
    eliminated = excluded.eliminated,
    time_spent_sec = public.responses.time_spent_sec + excluded.time_spent_sec,
    updated_at = now();
end;
$$;

-- The student ends the module (or time ran out). Returns the attempt's new state.
create or replace function public.finish_module(p_attempt_module_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_am public.attempt_modules;
begin
  v_am := private.own_attempt_module(p_attempt_module_id);
  if v_am.id is null then
    raise exception 'This test isn’t yours.' using errcode = '42501';
  end if;
  perform private.close_module(v_am.id);
  return (select status from public.attempts where id = v_am.attempt_id);
end;
$$;

-- After a test: every question with the student's answer, the right answer and the explanation.
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
            'seconds', coalesce(r.time_spent_sec, 0)
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

-- Only signed-in users may call the website functions; helpers stay private.
revoke all on function public.start_full_test(uuid) from public, anon;
revoke all on function public.get_test_state(uuid) from public, anon;
revoke all on function public.save_response(uuid, uuid, text, boolean, text[], integer) from public, anon;
revoke all on function public.finish_module(uuid) from public, anon;
revoke all on function public.get_test_results(uuid) from public, anon;
grant execute on function public.start_full_test(uuid) to authenticated;
grant execute on function public.get_test_state(uuid) to authenticated;
grant execute on function public.save_response(uuid, uuid, text, boolean, text[], integer) to authenticated;
grant execute on function public.finish_module(uuid) to authenticated;
grant execute on function public.get_test_results(uuid) to authenticated;

revoke all on function private.answer_matches(text, text, text[]) from public, anon, authenticated;
revoke all on function private.to_number(text) from public, anon, authenticated;
revoke all on function private.own_attempt_module(uuid) from public, anon, authenticated;
revoke all on function private.open_module(uuid, uuid) from public, anon, authenticated;
revoke all on function private.close_module(uuid) from public, anon, authenticated;
revoke all on function private.close_expired(uuid) from public, anon, authenticated;
