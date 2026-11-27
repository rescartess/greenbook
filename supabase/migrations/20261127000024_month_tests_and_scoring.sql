-- 0024 Month full tests: importing whole tests from a file, and a better score estimate.
--
-- 1. admin_import_test: the admin uploads a "greenbook-import-1" file with "tests" (Claude makes
--    them from the SATashkent month tests). One call adds one test: the set, its modules and its
--    questions. A question whose source is already in the database is reused, not copied, so the
--    month's adaptive test can share Module 1 and the hard Module 2 with a fixed test.
--    Running the same file again is safe: a test whose title already exists is skipped.
-- 2. Scores: like College Board, the estimate now depends on which questions were right, not only
--    how many. A 3-parameter item response model (difficulty from each question's level and its
--    module, a chance to guess on multiple choice) gives an ability estimate, which is put on the
--    200–800 scale. Calibrated against published Bluebook score ranges (owner request, 27 Nov 2026):
--    a perfect hard route is 800, one mistake about 780, the easy route tops out near 600.
--    The old score_tables stay (add before remove) but are no longer used.

create or replace function private.estimate_theta(p_attempt_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  with items as (
    select r.is_correct,
           (case q.difficulty when 'easy' then -0.9 when 'medium' then 0.2 else 1.4 end)
             + (case m.tier when 'standard' then 0 else 0.5 end) as b,
           case when q.type = 'spr' then 0.0 else 0.2 end as c
    from public.attempt_modules am
    join public.modules m on m.id = am.module_id
    join public.responses r on r.attempt_module_id = am.id
    join public.questions q on q.id = r.question_id
    where am.attempt_id = p_attempt_id and am.submitted_at is not null
  ),
  grid as (select g * 0.05 as th from generate_series(-80, 80) g),
  post as (
    select grid.th,
           -grid.th * grid.th / 2 + coalesce(sum(ln(
             case when items.is_correct then p.p else 1 - p.p end)), 0) as l
    from grid
    left join items on true
    left join lateral (select items.c + (1 - items.c) / (1 + exp(-(grid.th - items.b))) as p) p on true
    group by grid.th
  ),
  w as (select th, exp(l - max(l) over ()) as w from post)
  select round(sum(th * w) / sum(w), 4) from w;
$$;

-- 200–800. Ability 0 is 500; a perfect hard route (about 3.39 in English, 3.23 in Math) is 800.
create or replace function private.estimate_score(p_attempt_id uuid)
returns smallint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_subject text;
  v_theta numeric;
  v_top numeric;
  v_perfect boolean;
  v_score numeric;
begin
  select subject into v_subject from public.attempts where id = p_attempt_id;
  v_theta := private.estimate_theta(p_attempt_id);
  v_top := case v_subject when 'math' then 3.234 else 3.392 end;
  select bool_and(r.is_correct) and bool_or(m.module_number = 2 and m.tier <> 'easier') into v_perfect
  from public.attempt_modules am
  join public.modules m on m.id = am.module_id
  join public.responses r on r.attempt_module_id = am.id
  where am.attempt_id = p_attempt_id;
  if coalesce(v_perfect, false) then
    return 800;
  end if;
  v_score := case when v_theta >= 0 then 500 + 300 * v_theta / v_top else 500 + 150 * v_theta end;
  return least(790, greatest(200, round(v_score / 10) * 10))::smallint;
end;
$$;

revoke all on function private.estimate_theta(uuid) from public;
revoke all on function private.estimate_score(uuid) from public;

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

  -- Last module: total score (estimated from each question's difficulty, see private.estimate_score).
  select coalesce(sum(am.correct_count), 0) into v_raw
  from public.attempt_modules am where am.attempt_id = v_attempt.id;

  update public.attempts
  set status = 'completed',
      finished_at = now(),
      raw_correct = v_raw,
      scaled_score = private.estimate_score(v_attempt.id)
  where id = v_attempt.id;
end;
$$;

-- ---------- importing a whole test ----------

-- p_test: { title, subject, month ("2025-09-01"), adaptive, modules: [{ number, tier, minutes, items: [...] }] }
-- Items are like admin_import_questions' items. Returns { id, added, reused } or { skipped: true }.
create or replace function public.admin_import_test(p_test jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_subject text := p_test->>'subject';
  v_title text := trim(coalesce(p_test->>'title', ''));
  v_set uuid;
  v_module uuid;
  v_mod jsonb;
  v_item jsonb;
  v_qid uuid;
  v_type text;
  v_pos smallint;
  v_added integer := 0;
  v_reused integer := 0;
  v_order smallint := 0;
begin
  if not (select private.is_admin()) then
    raise exception 'Only the admin can import tests.' using errcode = '42501';
  end if;
  if v_title = '' or v_subject not in ('english', 'math') or jsonb_typeof(p_test->'modules') <> 'array' then
    raise exception 'The test needs a title, a subject and its modules.' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_array_elements(p_test->'modules') m where (m->>'number') = '1') <> 1
     or (select count(*) from jsonb_array_elements(p_test->'modules') m where (m->>'number') = '2') not between 1 and 2
     or exists (select 1 from jsonb_array_elements(p_test->'modules') m
                where (m->>'number') not in ('1', '2') or coalesce(m->>'tier', 'standard') not in ('standard', 'easier', 'harder')
                   or jsonb_typeof(m->'items') <> 'array' or jsonb_array_length(m->'items') = 0) then
    raise exception 'A test has one Module 1 and one or two Module 2s, each with questions.' using errcode = '22023';
  end if;
  if exists (select 1 from public.question_sets where kind = 'full_test' and subject = v_subject and title = v_title) then
    return jsonb_build_object('skipped', true);
  end if;

  insert into public.question_sets (kind, title, subject, month, is_adaptive, published)
  values ('full_test', v_title, v_subject, nullif(p_test->>'month', '')::date, coalesce((p_test->>'adaptive')::boolean, false), false)
  returning id into v_set;

  for v_mod in select value from jsonb_array_elements(p_test->'modules') loop
    v_order := v_order + 1;
    insert into public.modules (set_id, module_number, tier, time_limit_sec, sort_order)
    values (v_set, (v_mod->>'number')::smallint, coalesce(v_mod->>'tier', 'standard'),
            coalesce((v_mod->>'minutes')::integer, case v_subject when 'math' then 35 else 32 end) * 60, v_order)
    returning id into v_module;
    v_pos := 1;
    for v_item in select value from jsonb_array_elements(v_mod->'items') loop
      select id into v_qid from public.questions where source = v_item->>'source' and subject = v_subject order by created_at limit 1;
      if v_qid is not null then
        v_reused := v_reused + 1;
      else
        v_type := coalesce(nullif(v_item->>'type', ''), 'mcq');
        if coalesce(trim(v_item->>'source'), '') = '' or coalesce(trim(v_item->>'prompt'), '') = ''
           or coalesce(trim(v_item->>'answer'), '') = '' or jsonb_typeof(v_item->'choices') <> 'array'
           or (v_item->>'difficulty') not in ('easy', 'medium', 'hard')
           or v_type not in ('mcq', 'spr')
           or (v_type = 'spr' and (v_subject <> 'math' or jsonb_array_length(v_item->'choices') > 0))
           or (v_type = 'mcq' and jsonb_array_length(v_item->'choices') < 2)
           or (v_type = 'mcq' and not exists (select 1 from jsonb_array_elements(v_item->'choices') c where c->>'id' = v_item->>'answer'))
           or (v_item ? 'accepted' and jsonb_typeof(v_item->'accepted') <> 'array') then
          raise exception 'Question % is incomplete.', coalesce(v_item->>'source', '?') using errcode = '22023';
        end if;
        insert into public.questions (external_id, subject, skill_id, difficulty, type, passage, prompt, choices, image_path, status, source)
        values (
          case v_subject when 'english' then 'eng' else 'math' end || '-' || to_char(now(), 'YYMMDD') || '-'
            || substr(md5(gen_random_uuid()::text), 1, 10),
          v_subject,
          (select id from public.skills where slug = v_item->>'skill'),
          v_item->>'difficulty', v_type, nullif(v_item->>'passage', ''), v_item->>'prompt',
          v_item->'choices', nullif(v_item->>'image', ''), 'draft', v_item->>'source'
        )
        returning id into v_qid;
        insert into public.question_answers (question_id, correct_answer, accepted_answers, explanation)
        values (
          v_qid, v_item->>'answer',
          coalesce((select array_agg(a) from jsonb_array_elements_text(coalesce(v_item->'accepted', '[]'::jsonb)) a), '{}'),
          nullif(v_item->>'explanation', '')
        );
        v_added := v_added + 1;
      end if;
      insert into public.module_questions (module_id, question_id, position) values (v_module, v_qid, v_pos);
      v_pos := v_pos + 1;
    end loop;
  end loop;
  return jsonb_build_object('id', v_set, 'added', v_added, 'reused', v_reused);
end;
$$;

revoke all on function public.admin_import_test(jsonb) from public, anon;
grant execute on function public.admin_import_test(jsonb) to authenticated;
