-- 0012 Topic practice (owner request, 25 Nov 2026).
-- Each topic is a question set of kind 'topic' with one module; its question order is fixed by the
-- admin, so every student sees the same questions in the same order. A student picks a difficulty
-- (or all), a range (#1-25, #26-50...), whether to check as they go or at the end, and an optional
-- timer. Answers stay on the server until a question is checked or the practice is finished.

alter table public.question_sets
  add column sort_order smallint not null default 0,
  add column description text;

alter table public.attempts
  add column check_mode text not null default 'each' check (check_mode in ('each', 'end')),
  add column options jsonb;

-- The ten English topics, in the owner's order. They start hidden; publishing one in the admin
-- area publishes its questions too. Command of Evidence holds both kinds, so it has no single skill.
insert into public.question_sets (kind, title, subject, skill_id, sort_order, description, is_adaptive, published)
select 'topic', t.title, 'english', (select id from public.skills where slug = t.slug), t.n, t.description, false, false
from (values
  (1, 'Boundaries', 'english-boundaries', 'Punctuation that joins or separates clauses and phrases.'),
  (2, 'Form, Structure, and Sense', 'english-form-structure-and-sense', 'Verb forms, agreement, pronouns, possessives and modifiers.'),
  (3, 'Transitions', 'english-transitions', 'The word or phrase that links two ideas logically.'),
  (4, 'Student Notes', 'english-rhetorical-synthesis', 'Use a student’s notes to meet a stated goal.'),
  (5, 'Central Ideas and Details', 'english-central-ideas-and-details', 'The main point of a text and the details that support it.'),
  (6, 'Inferences', 'english-inferences', 'The conclusion that most logically completes a text.'),
  (7, 'Command of Evidence', null, 'Quotations, findings and data that support or weaken a claim. Textual and quantitative.'),
  (8, 'Cross-Text Connections', 'english-cross-text-connections', 'How the author of one text would respond to another.'),
  (9, 'Text Structure and Purpose', 'english-text-structure-and-purpose', 'Overall structure, main purpose, and the function of a sentence.'),
  (10, 'Words in Context', 'english-words-in-context', 'The word or phrase that fits the context most precisely.')
) as t (n, title, slug, description);

insert into public.modules (set_id, module_number, tier, time_limit_sec, sort_order)
select s.id, 1, 'standard', null, 1
from public.question_sets s
where s.kind = 'topic' and not exists (select 1 from public.modules m where m.set_id = s.id);

-- The questions of a topic (or monthly) set in their fixed order, numbered 1, 2, 3... within the
-- chosen difficulty. Students get published questions; admins also get drafts, to try a topic first.
create or replace function private.topic_items(p_set_id uuid, p_difficulty text)
returns table (question_id uuid, difficulty text, n integer)
language sql
stable
security definer
set search_path = ''
as $$
  select q.id, q.difficulty,
         (row_number() over (order by m.sort_order, m.module_number, m.id, mq.position))::integer
  from public.modules m
  join public.module_questions mq on mq.module_id = m.id
  join public.questions q on q.id = mq.question_id
  where m.set_id = p_set_id
    and (q.status = 'published' or (q.status = 'draft' and (select private.is_admin())))
    and (p_difficulty = 'all' or q.difficulty = p_difficulty)
  order by m.sort_order, m.module_number, m.id, mq.position;
$$;

-- The Topics page: every topic with how many questions it has at each level, and how many of
-- them this student has already answered.
create or replace function public.list_topics(p_subject text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'title', s.title, 'description', s.description, 'published', s.published,
    'easy', c.easy, 'medium', c.medium, 'hard', c.hard, 'done', c.done,
    'open', (select count(*) from public.attempts a
             where a.set_id = s.id and a.user_id = (select auth.uid()) and a.status = 'in_progress' and a.mode = 'practice')
  ) order by s.sort_order, s.created_at), '[]'::jsonb)
  from public.question_sets s
  cross join lateral (
    select count(*) filter (where i.difficulty = 'easy') as easy,
           count(*) filter (where i.difficulty = 'medium') as medium,
           count(*) filter (where i.difficulty = 'hard') as hard,
           count(p.question_id) as done
    from private.topic_items(s.id, 'all') i
    left join public.question_progress p on p.question_id = i.question_id and p.user_id = (select auth.uid())
  ) c
  where s.kind = 'topic' and s.subject = p_subject and (s.published or (select private.is_admin()));
$$;

-- One topic's setup page: the level of each question in order and the student's last result on
-- it (no question text, no answers), plus practices the student hasn't finished yet.
create or replace function public.get_topic(p_set_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_set public.question_sets;
begin
  select * into v_set from public.question_sets
  where id = p_set_id and kind in ('topic', 'monthly') and (published or (select private.is_admin()));
  if v_set.id is null then
    raise exception 'This topic isn’t available.' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'id', v_set.id, 'title', v_set.title, 'description', v_set.description, 'subject', v_set.subject,
    'published', v_set.published,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object('d', i.difficulty, 'r', p.last_result) order by i.n), '[]'::jsonb)
      from private.topic_items(v_set.id, 'all') i
      left join public.question_progress p on p.question_id = i.question_id and p.user_id = (select auth.uid())
    ),
    'open', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'attemptId', a.id, 'options', a.options, 'checkMode', a.check_mode, 'startedAt', a.started_at,
        'total', cardinality(am.question_ids),
        'answered', (select count(*) from public.responses r where r.attempt_module_id = am.id and r.answer is not null)
      ) order by a.started_at desc), '[]'::jsonb)
      from public.attempts a
      join public.attempt_modules am on am.attempt_id = a.id
      where a.set_id = v_set.id and a.user_id = (select auth.uid()) and a.status = 'in_progress' and a.mode = 'practice'
    )
  );
end;
$$;

-- Starts a practice: questions p_from .. p_from + p_count - 1 of the chosen level, in order.
-- p_check_mode 'each' (a Check button per question) or 'end' (graded when finished).
-- p_minutes null for no timer.
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
  if p_from is null or p_from < 1 or p_count is null or p_count < 1 or p_count > 200 then
    raise exception 'Pick between 1 and 200 questions.' using errcode = '22023';
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

-- Saves a pick, a "Mark for Review" or a crossed-out choice without grading it.
-- Once a question has been checked its answer is final; marks can still change.
create or replace function public.save_practice_response(
  p_attempt_module_id uuid, p_question_id uuid, p_answer text, p_marked boolean, p_eliminated text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_am public.attempt_modules;
  v_attempt public.attempts;
  v_existing public.responses;
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
  if v_am.paused_remaining_sec is not null then
    raise exception 'This practice is paused. Open it again to keep going.' using errcode = 'P0007';
  end if;
  if v_am.deadline_at is not null and now() > v_am.deadline_at + interval '30 seconds' then
    raise exception 'Time is up for this practice.' using errcode = 'P0004';
  end if;
  if length(p_answer) > 20 or cardinality(p_eliminated) > 10 then
    raise exception 'That answer is too long.' using errcode = '22023';
  end if;

  select * into v_existing from public.responses where attempt_module_id = v_am.id and question_id = p_question_id;
  if v_existing.is_correct is not null then
    update public.responses
    set marked_for_review = coalesce(p_marked, false), eliminated = coalesce(p_eliminated, '{}'), updated_at = now()
    where attempt_module_id = v_am.id and question_id = p_question_id;
    return;
  end if;

  insert into public.responses (attempt_module_id, question_id, question_version, answer, marked_for_review, eliminated)
  values (v_am.id, p_question_id, (select version from public.questions where id = p_question_id),
          nullif(trim(p_answer), ''), coalesce(p_marked, false), coalesce(p_eliminated, '{}'))
  on conflict (attempt_module_id, question_id) do update set
    answer = excluded.answer,
    marked_for_review = excluded.marked_for_review,
    eliminated = excluded.eliminated,
    updated_at = now();
end;
$$;

-- Same as 0010, plus: refused when the student chose to check at the end, while paused, or after time is up.
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
  if v_attempt.check_mode = 'end' then
    raise exception 'In this practice, answers are checked at the end.' using errcode = 'P0008';
  end if;
  if not (p_question_id = any (v_am.question_ids)) then
    raise exception 'That question isn’t in this practice.' using errcode = 'P0005';
  end if;
  if v_am.paused_remaining_sec is not null then
    raise exception 'This practice is paused. Open it again to keep going.' using errcode = 'P0007';
  end if;
  if v_am.deadline_at is not null and now() > v_am.deadline_at + interval '30 seconds' then
    raise exception 'Time is up for this practice.' using errcode = 'P0004';
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

-- Same as 0010, plus: grades every answer that wasn't checked yet (all of them in "check at the end").
-- Skipped questions count as not correct but don't go to Mistakes.
create or replace function public.finish_practice(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts;
  v_correct integer;
  v_row record;
  v_ok boolean;
begin
  select * into v_attempt from public.attempts
  where id = p_attempt_id and mode = 'practice' and user_id = (select auth.uid());
  if v_attempt.id is null then
    raise exception 'This practice isn’t yours.' using errcode = '42501';
  end if;
  if v_attempt.status <> 'in_progress' then
    return;
  end if;

  for v_row in
    select r.attempt_module_id, r.question_id, r.answer
    from public.attempt_modules am join public.responses r on r.attempt_module_id = am.id
    where am.attempt_id = v_attempt.id and r.is_correct is null and r.answer is not null
  loop
    select private.answer_matches(v_row.answer, qa.correct_answer, qa.accepted_answers) into v_ok
    from public.question_answers qa where qa.question_id = v_row.question_id;
    v_ok := coalesce(v_ok, false);
    update public.responses set is_correct = v_ok, updated_at = now()
    where attempt_module_id = v_row.attempt_module_id and question_id = v_row.question_id;
    perform private.record_progress(v_attempt.user_id, v_row.question_id, v_ok);
  end loop;

  select count(*) filter (where r.is_correct) into v_correct
  from public.attempt_modules am join public.responses r on r.attempt_module_id = am.id
  where am.attempt_id = v_attempt.id;
  update public.attempt_modules
  set submitted_at = now(), correct_count = v_correct, paused_remaining_sec = null
  where attempt_id = v_attempt.id;
  update public.attempts set status = 'completed', finished_at = now(), raw_correct = v_correct where id = v_attempt.id;
end;
$$;

-- Same as 0010, plus: the student's picks and marks, the options they chose, the clock (a paused
-- clock restarts when the student opens it), and after finishing, the right answer to every question.
create or replace function public.get_practice_state(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.attempts;
  v_am public.attempt_modules;
  v_done boolean;
begin
  select * into v_attempt from public.attempts
  where id = p_attempt_id and mode = 'practice' and (user_id = (select auth.uid()) or (select private.is_admin()));
  if v_attempt.id is null then
    raise exception 'This practice isn’t yours.' using errcode = '42501';
  end if;
  select * into v_am from public.attempt_modules where attempt_id = v_attempt.id order by started_at limit 1;
  if v_am.paused_remaining_sec is not null and v_attempt.status = 'in_progress' and v_attempt.user_id = (select auth.uid()) then
    update public.attempt_modules
    set deadline_at = now() + make_interval(secs => v_am.paused_remaining_sec), paused_remaining_sec = null
    where id = v_am.id
    returning * into v_am;
  end if;
  v_done := v_attempt.status = 'completed';

  return jsonb_build_object(
    'attemptId', v_attempt.id,
    'attemptModuleId', v_am.id,
    'status', v_attempt.status,
    'setId', v_attempt.set_id,
    'title', (select title from public.question_sets where id = v_attempt.set_id),
    'kind', (select kind from public.question_sets where id = v_attempt.set_id),
    'subject', v_attempt.subject,
    'checkMode', v_attempt.check_mode,
    'options', v_attempt.options,
    'deadlineAt', v_am.deadline_at,
    'serverNow', now(),
    'moreAfter', case when v_attempt.options is null then 0 else (
      select count(*) from private.topic_items(v_attempt.set_id, v_attempt.options ->> 'difficulty') i
      where i.n > (v_attempt.options ->> 'to')::integer
    ) end,
    'questions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', q.id, 'position', ord.n, 'type', q.type, 'passage', q.passage, 'prompt', q.prompt, 'choices', q.choices,
        'skill', s.name, 'difficulty', q.difficulty,
        'answer', r.answer, 'marked', coalesce(r.marked_for_review, false), 'eliminated', coalesce(r.eliminated, '{}'),
        'feedback', case
          when v_done then private.feedback(q.id, r.answer, coalesce(r.is_correct, false))
          when r.is_correct is null then null
          else private.feedback(q.id, r.answer, r.is_correct) end
      ) order by ord.n), '[]'::jsonb)
      from unnest(v_am.question_ids) with ordinality as ord(question_id, n)
      join public.questions q on q.id = ord.question_id
      left join public.skills s on s.id = q.skill_id
      left join public.responses r on r.attempt_module_id = v_am.id and r.question_id = q.id
    )
  );
end;
$$;

revoke all on function private.topic_items(uuid, text) from public, anon, authenticated;
revoke all on function public.list_topics(text) from public, anon;
revoke all on function public.get_topic(uuid) from public, anon;
revoke all on function public.start_topic_practice(uuid, text, integer, integer, text, integer) from public, anon;
revoke all on function public.save_practice_response(uuid, uuid, text, boolean, text[]) from public, anon;
grant execute on function public.list_topics(text) to authenticated;
grant execute on function public.get_topic(uuid) to authenticated;
grant execute on function public.start_topic_practice(uuid, text, integer, integer, text, integer) to authenticated;
grant execute on function public.save_practice_response(uuid, uuid, text, boolean, text[]) to authenticated;
