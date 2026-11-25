-- 0011 "Save and exit" and "Delete and exit" on the test screen.
-- Save and exit stops the module's clock and keeps the time left; opening the test
-- again restarts it. Delete and exit marks the attempt abandoned: it disappears from
-- the student's lists and counts nowhere. Nothing is actually deleted.

alter table public.attempt_modules add column paused_remaining_sec integer check (paused_remaining_sec >= 0);

-- get_test_state: now restarts a paused module's clock when its owner opens it.
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


-- save_response: now refuses answers while the module is paused.
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
  if v_am.paused_remaining_sec is not null then
    raise exception 'This test is paused. Open it again to keep going.' using errcode = 'P0007';
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


create or replace function public.pause_test(p_attempt_module_id uuid)
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
  if v_am.submitted_at is not null or v_am.deadline_at is null or v_am.paused_remaining_sec is not null then
    return;
  end if;
  if now() > v_am.deadline_at + interval '30 seconds' then
    perform private.close_expired(v_am.attempt_id);
    return;
  end if;
  update public.attempt_modules
  set paused_remaining_sec = greatest(0, ceil(extract(epoch from v_am.deadline_at - now())))::integer,
      deadline_at = null
  where id = v_am.id;
end;
$$;

create or replace function public.abandon_test(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.attempts
  set status = 'abandoned', finished_at = now()
  where id = p_attempt_id and user_id = (select auth.uid()) and status = 'in_progress';
  if not found then
    raise exception 'This test isn’t yours or is already over.' using errcode = '42501';
  end if;
  update public.attempt_modules
  set submitted_at = coalesce(submitted_at, now()), paused_remaining_sec = null
  where attempt_id = p_attempt_id;
end;
$$;

revoke all on function public.pause_test(uuid) from public, anon;
revoke all on function public.abandon_test(uuid) from public, anon;
grant execute on function public.pause_test(uuid) to authenticated;
grant execute on function public.abandon_test(uuid) to authenticated;
