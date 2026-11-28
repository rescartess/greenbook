-- 0028 Take part of a full test (owner request 28 Nov 2026): when starting a full test the student
-- picks "Full test", "Module 1 only" or "Module 2 only" (for an adaptive test: the hard or the easy
-- Module 2). One module alone has no 200–800 score: it is counted by questions right, so it never
-- shows up as a best or latest score anywhere. Nothing is removed; start_full_test keeps working.

alter table public.attempts
  add column part text not null default 'full' check (part in ('full', 'module1', 'module2'));

-- Starts a full test, Module 1 only or Module 2 only. If this test is already running (any part),
-- returns that attempt so the student continues where they left off.
create or replace function public.start_test_part(p_set_id uuid, p_part text default 'full', p_tier text default null)
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
  if p_part not in ('full', 'module1', 'module2') or coalesce(p_tier, 'harder') not in ('harder', 'easier') then
    raise exception 'Pick the full test, Module 1 or Module 2.' using errcode = '22023';
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

  if p_part = 'module2' then
    select m.id into v_first from public.modules m
    where m.set_id = p_set_id and m.module_number = 2
    order by (m.tier = coalesce(p_tier, 'harder')) desc, (m.tier = 'standard') desc, m.sort_order
    limit 1;
  else
    select m.id into v_first from public.modules m
    where m.set_id = p_set_id and m.module_number = 1
    order by m.sort_order limit 1;
  end if;
  if v_first is null then
    raise exception 'This test has no such module.' using errcode = 'P0002';
  end if;

  insert into public.attempts (user_id, set_id, subject, mode, part)
  values (v_user, p_set_id, v_set.subject, 'timed', p_part)
  returning id into v_attempt;
  perform private.open_module(v_attempt, v_first);
  return v_attempt;
end;
$$;

revoke all on function public.start_test_part(uuid, text, text) from public, anon;
grant execute on function public.start_test_part(uuid, text, text) to authenticated;

-- close_module (from 0024): "Module 1 only" stops after Module 1; a single module gets no 200–800 score.
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

  if v_module.module_number = 1 and v_attempt.part = 'full' then
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

  -- Last module: total score (estimated from each question's difficulty, see private.estimate_score).
  select coalesce(sum(am.correct_count), 0) into v_raw
  from public.attempt_modules am where am.attempt_id = v_attempt.id;

  update public.attempts
  set status = 'completed',
      finished_at = now(),
      raw_correct = v_raw,
      scaled_score = case when v_attempt.part = 'full' then private.estimate_score(v_attempt.id) end
  where id = v_attempt.id;
end;
$$;

-- get_test_state (from 0011): a part taken alone ends after its one module ("isLast"), and says which part.
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
    return jsonb_build_object('attemptId', v_attempt.id, 'status', v_attempt.status, 'title', v_title, 'subject', v_attempt.subject, 'part', v_attempt.part);
  end if;

  select * into v_am from public.attempt_modules
  where attempt_id = v_attempt.id and submitted_at is null
  order by started_at desc limit 1;

  -- Coming back after "Save and exit": restart the clock with the time that was left.
  if v_am.paused_remaining_sec is not null and v_attempt.user_id = (select auth.uid()) then
    update public.attempt_modules
    set deadline_at = now() + make_interval(secs => v_am.paused_remaining_sec), paused_remaining_sec = null
    where id = v_am.id
    returning * into v_am;
  end if;
  select * into v_module from public.modules where id = v_am.module_id;
  select count(*) into v_count from public.attempt_modules where attempt_id = v_attempt.id;

  return jsonb_build_object(
    'attemptId', v_attempt.id,
    'status', v_attempt.status,
    'title', v_title,
    'subject', v_attempt.subject,
    'part', v_attempt.part,
    'module', jsonb_build_object(
      'attemptModuleId', v_am.id,
      'number', v_module.module_number,
      'deadlineAt', v_am.deadline_at,
      'serverNow', now(),
      'isLast', v_attempt.part <> 'full' or v_module.module_number = 2 or not exists (
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

-- list_my_attempts (from 0019): also says which part was taken, for the Results cards.
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
      'part', a.part,
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
