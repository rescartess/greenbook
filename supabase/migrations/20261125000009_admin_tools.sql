-- 0009 Admin tools: create tests and add questions in one step each.
-- These run with the caller's own rights (security invoker), so the admin-only
-- row rules from 0002/0006 still decide who may write. Each call is all-or-nothing.

-- A new full test with module 1 and both versions of module 2.
create or replace function public.admin_create_test(p_title text, p_subject text, p_minutes integer)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_set uuid;
  v_secs integer := greatest(1, coalesce(p_minutes, 32)) * 60;
begin
  if coalesce(trim(p_title), '') = '' then
    raise exception 'Give the test a name.' using errcode = '22023';
  end if;
  insert into public.question_sets (kind, title, subject, is_adaptive, published)
  values ('full_test', trim(p_title), p_subject, true, false)
  returning id into v_set;
  insert into public.modules (set_id, module_number, tier, time_limit_sec, sort_order) values
    (v_set, 1, 'standard', v_secs, 1),
    (v_set, 2, 'easier', v_secs, 2),
    (v_set, 2, 'harder', v_secs, 3);
  return v_set;
end;
$$;

-- Adds questions to the end of a module. p_items is a list of
-- { passage, prompt, choices: [{id,text}], answer, explanation, skill_id, difficulty, type, accepted }.
-- Returns the new question ids (external ids) in order.
create or replace function public.admin_add_questions(p_module_id uuid, p_items jsonb)
returns text[]
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_subject text;
  v_next smallint;
  v_item jsonb;
  v_qid uuid;
  v_ext text;
  v_out text[] := '{}';
begin
  select s.subject into v_subject
  from public.modules m join public.question_sets s on s.id = m.set_id
  where m.id = p_module_id;
  if v_subject is null then
    raise exception 'That module doesn’t exist.' using errcode = 'P0002';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'There are no questions to add.' using errcode = '22023';
  end if;

  select coalesce(max(position), 0) + 1 into v_next from public.module_questions where module_id = p_module_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_ext := case v_subject when 'english' then 'eng' else 'math' end
             || '-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
    insert into public.questions (external_id, subject, skill_id, difficulty, type, passage, prompt, choices, status, source)
    values (
      v_ext, v_subject, (v_item->>'skill_id')::integer, v_item->>'difficulty', coalesce(v_item->>'type', 'mcq'),
      nullif(v_item->>'passage', ''), v_item->>'prompt', v_item->'choices', 'draft', 'admin'
    )
    returning id into v_qid;
    insert into public.question_answers (question_id, correct_answer, accepted_answers, explanation)
    values (
      v_qid, v_item->>'answer',
      coalesce(array(select jsonb_array_elements_text(v_item->'accepted')), '{}'),
      nullif(v_item->>'explanation', '')
    );
    insert into public.module_questions (module_id, question_id, position) values (p_module_id, v_qid, v_next);
    v_next := v_next + 1;
    v_out := v_out || v_ext;
  end loop;
  return v_out;
end;
$$;

-- Takes a question out of a module (the question itself stays) and closes the gap.
create or replace function public.admin_remove_from_module(p_module_id uuid, p_question_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_pos smallint;
begin
  delete from public.module_questions
  where module_id = p_module_id and question_id = p_question_id
  returning position into v_pos;
  if v_pos is null then
    return;
  end if;
  -- Shift later questions up one place (two steps to keep positions unique).
  update public.module_questions set position = -position where module_id = p_module_id and position > v_pos;
  update public.module_questions set position = -position - 1 where module_id = p_module_id and position < 0;
end;
$$;

-- Moves a question one place up or down inside its module.
create or replace function public.admin_move_in_module(p_module_id uuid, p_question_id uuid, p_direction integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_pos smallint;
  v_other uuid;
begin
  select position into v_pos from public.module_questions where module_id = p_module_id and question_id = p_question_id;
  if v_pos is null then
    return;
  end if;
  select question_id into v_other from public.module_questions
  where module_id = p_module_id and position = v_pos + sign(p_direction);
  if v_other is null then
    return;
  end if;
  update public.module_questions set position = -1 where module_id = p_module_id and question_id = p_question_id;
  update public.module_questions set position = v_pos where module_id = p_module_id and question_id = v_other;
  update public.module_questions set position = v_pos + sign(p_direction) where module_id = p_module_id and question_id = p_question_id;
end;
$$;

revoke all on function public.admin_create_test(text, text, integer) from public, anon;
revoke all on function public.admin_add_questions(uuid, jsonb) from public, anon;
revoke all on function public.admin_remove_from_module(uuid, uuid) from public, anon;
revoke all on function public.admin_move_in_module(uuid, uuid, integer) from public, anon;
grant execute on function public.admin_create_test(text, text, integer) to authenticated;
grant execute on function public.admin_add_questions(uuid, jsonb) to authenticated;
grant execute on function public.admin_remove_from_module(uuid, uuid) to authenticated;
grant execute on function public.admin_move_in_module(uuid, uuid, integer) to authenticated;
