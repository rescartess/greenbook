-- 0014 Question pictures and book import (owner request, 25 Nov 2026).
-- Tables and graphs are pictures (questions.image_path) kept in the public storage bucket "question-images";
-- only admins can add or change them. Every screen's question data now includes 'image'.
-- admin_import_questions adds a batch of questions from an import file to a topic, skipping ones already
-- imported (same source), so an import can safely be run again after a dropped connection.

-- The storage bucket and its rules (only on Supabase; the test database has no storage schema).
do $storage$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public) values ('question-images', 'question-images', true)
    on conflict (id) do update set public = true;
    execute $p$drop policy if exists "Admins add question images" on storage.objects$p$;
    execute $p$drop policy if exists "Admins change question images" on storage.objects$p$;
    execute $p$drop policy if exists "Admins remove question images" on storage.objects$p$;
    execute $p$create policy "Admins add question images" on storage.objects for insert to authenticated
      with check (bucket_id = 'question-images' and (select private.is_admin()))$p$;
    execute $p$create policy "Admins change question images" on storage.objects for update to authenticated
      using (bucket_id = 'question-images' and (select private.is_admin()))
      with check (bucket_id = 'question-images' and (select private.is_admin()))$p$;
    execute $p$create policy "Admins remove question images" on storage.objects for delete to authenticated
      using (bucket_id = 'question-images' and (select private.is_admin()))$p$;
  end if;
end
$storage$;

-- Adds questions to the end of a topic, in the order given. Each item:
-- { source, skill (slug), difficulty, passage, prompt, choices: [{id,text}], answer, image }.
-- Returns how many were added (items whose source already exists are skipped). Admin rules apply.
create or replace function public.admin_import_questions(p_topic_id uuid, p_items jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_set public.question_sets;
  v_module uuid;
  v_next smallint;
  v_item jsonb;
  v_qid uuid;
  v_added integer := 0;
begin
  if not (select private.is_admin()) then
    raise exception 'Only the admin can import questions.' using errcode = '42501';
  end if;
  select * into v_set from public.question_sets where id = p_topic_id and kind in ('topic', 'monthly');
  if v_set.id is null then
    raise exception 'That topic doesn’t exist.' using errcode = 'P0002';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 300 then
    raise exception 'Send between 1 and 300 questions at a time.' using errcode = '22023';
  end if;
  select id into v_module from public.modules where set_id = v_set.id order by sort_order, module_number limit 1;
  select coalesce(max(position), 0) + 1 into v_next from public.module_questions where module_id = v_module;

  for v_item in select value from jsonb_array_elements(p_items) loop
    if coalesce(trim(v_item->>'source'), '') = '' or coalesce(trim(v_item->>'prompt'), '') = ''
       or (v_item->>'answer') is null or jsonb_typeof(v_item->'choices') <> 'array'
       or (v_item->>'difficulty') not in ('easy', 'medium', 'hard') then
      raise exception 'Question % is incomplete.', coalesce(v_item->>'source', '?') using errcode = '22023';
    end if;
    continue when exists (select 1 from public.questions where source = v_item->>'source');
    insert into public.questions (external_id, subject, skill_id, difficulty, type, passage, prompt, choices, image_path, status, source)
    values (
      case v_set.subject when 'english' then 'eng' else 'math' end || '-' || to_char(now(), 'YYMMDD') || '-'
        || substr(md5(gen_random_uuid()::text), 1, 6),
      v_set.subject,
      (select id from public.skills where slug = v_item->>'skill'),
      v_item->>'difficulty', 'mcq', nullif(v_item->>'passage', ''), v_item->>'prompt', v_item->'choices',
      nullif(v_item->>'image', ''), 'draft', v_item->>'source'
    )
    returning id into v_qid;
    insert into public.question_answers (question_id, correct_answer) values (v_qid, v_item->>'answer');
    insert into public.module_questions (module_id, question_id, position) values (v_module, v_qid, v_next);
    v_next := v_next + 1;
    v_added := v_added + 1;
  end loop;
  return v_added;
end;
$$;

create index if not exists questions_source on public.questions (source);

revoke all on function public.admin_import_questions(uuid, jsonb) from public, anon;
grant execute on function public.admin_import_questions(uuid, jsonb) to authenticated;

-- Practice, results and mistakes get the picture with each question (same functions as before, plus 'image').
-- (get_test_state already sends it as 'imagePath'.)
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
        'id', q.id, 'position', ord.n, 'type', q.type, 'passage', q.passage, 'prompt', q.prompt, 'choices', q.choices, 'image', q.image_path,
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
            'image', q.image_path,
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

create or replace function public.get_mistakes(p_subject text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id, 'passage', q.passage, 'prompt', q.prompt, 'choices', q.choices, 'type', q.type, 'image', q.image_path,
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
