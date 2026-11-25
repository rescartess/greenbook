-- 0017: a second collection of topics, "SQB" (College Board's SAT Suite Question Bank).
-- The owner has College Board's permission to publish them with credit (26 Nov 2026).
-- Topic sets now belong to a collection: 'books' (the owner's own question books) or 'sqb'.
-- The Topics page shows one collection at a time. Imports also keep the explanation.

alter table public.question_sets
  add column collection text not null default 'books' check (collection in ('books', 'sqb'));

insert into public.question_sets (kind, title, subject, skill_id, sort_order, description, is_adaptive, published, collection)
select 'topic', t.title, 'english', (select id from public.skills where slug = t.slug), t.n, null, false, false, 'sqb'
from (values
  (1, 'Boundaries', 'english-boundaries'),
  (2, 'Form, Structure, and Sense', 'english-form-structure-and-sense'),
  (3, 'Transitions', 'english-transitions'),
  (4, 'Student Notes', 'english-rhetorical-synthesis'),
  (5, 'Central Ideas and Details', 'english-central-ideas-and-details'),
  (6, 'Inferences', 'english-inferences'),
  (7, 'Command of Evidence', null),
  (8, 'Cross-Text Connections', 'english-cross-text-connections'),
  (9, 'Text Structure and Purpose', 'english-text-structure-and-purpose'),
  (10, 'Words in Context', 'english-words-in-context')
) as t (n, title, slug);

insert into public.modules (set_id, module_number, tier, time_limit_sec, sort_order)
select s.id, 1, 'standard', null, 1
from public.question_sets s
where s.kind = 'topic' and not exists (select 1 from public.modules m where m.set_id = s.id);

-- The Topics page for one collection.
create function public.list_topics(p_subject text, p_collection text)
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
  where s.kind = 'topic' and s.subject = p_subject and s.collection = p_collection
    and (s.published or (select private.is_admin()));
$$;

-- The old one-argument version keeps showing only the books collection.
create or replace function public.list_topics(p_subject text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.list_topics(p_subject, 'books');
$$;

revoke all on function public.list_topics(text, text) from public, anon;
grant execute on function public.list_topics(text, text) to authenticated;

-- One topic's setup page now also says which collection it belongs to.
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
    'published', v_set.published, 'collection', v_set.collection,
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

-- Imports keep each question's explanation (College Board's rationale for SQB).
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
        || substr(md5(gen_random_uuid()::text), 1, 10),
      v_set.subject,
      (select id from public.skills where slug = v_item->>'skill'),
      v_item->>'difficulty', 'mcq', nullif(v_item->>'passage', ''), v_item->>'prompt', v_item->'choices',
      nullif(v_item->>'image', ''), 'draft', v_item->>'source'
    )
    returning id into v_qid;
    insert into public.question_answers (question_id, correct_answer, explanation)
    values (v_qid, v_item->>'answer', nullif(v_item->>'explanation', ''));
    insert into public.module_questions (module_id, question_id, position) values (v_module, v_qid, v_next);
    v_next := v_next + 1;
    v_added := v_added + 1;
  end loop;
  return v_added;
end;
$$;
