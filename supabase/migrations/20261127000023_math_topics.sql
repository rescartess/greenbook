-- 0023 Math topics (owner request, 27 Nov 2026).
-- The 19 College Board Math skills become topics, once in GreenBook's own books ('books', from the
-- owner's SATashkent MathBook 3.0 and Math Hard Book) and once for SQB ('sqb'). All start hidden;
-- publishing a topic in the admin area publishes its questions.
-- Imports can now hold Math typed-answer questions ("spr"): no choices, the book's answer, and the
-- other forms that also count (accepted_answers, e.g. 4.8 for 24/5).

insert into public.question_sets (kind, title, subject, skill_id, sort_order, description, is_adaptive, published, collection)
select 'topic', t.title, 'math', (select id from public.skills where slug = t.slug), t.n, null, false, false, c.collection
from (values
  (1, 'Linear Equations in One Variable', 'math-linear-equations-in-one-variable'),
  (2, 'Linear Equations in Two Variables', 'math-linear-equations-in-two-variables'),
  (3, 'Linear Functions', 'math-linear-functions'),
  (4, 'Systems of Two Linear Equations in Two Variables', 'math-systems-of-two-linear-equations-in-two-variables'),
  (5, 'Linear Inequalities in One or Two Variables', 'math-linear-inequalities-in-one-or-two-variables'),
  (6, 'Nonlinear Functions', 'math-nonlinear-functions'),
  (7, 'Nonlinear Equations in One Variable and Systems of Equations in Two Variables',
      'math-nonlinear-equations-in-one-variable-and-systems-of-equations-in-two-variables'),
  (8, 'Equivalent Expressions', 'math-equivalent-expressions'),
  (9, 'Percentages', 'math-percentages'),
  (10, 'Ratios, Rates, Proportional Relationships, and Units', 'math-ratios-rates-proportional-relationships-and-units'),
  (11, 'One-Variable Data: Distributions and Measures of Center and Spread',
       'math-one-variable-data-distributions-and-measures-of-center-and-spread'),
  (12, 'Two-Variable Data: Models and Scatterplots', 'math-two-variable-data-models-and-scatterplots'),
  (13, 'Probability and Conditional Probability', 'math-probability-and-conditional-probability'),
  (14, 'Inference from Sample Statistics and Margin of Error', 'math-inference-from-sample-statistics-and-margin-of-error'),
  (15, 'Evaluating Statistical Claims: Observational Studies and Experiments',
       'math-evaluating-statistical-claims-observational-studies-and-experiments'),
  (16, 'Area and Volume', 'math-area-and-volume'),
  (17, 'Lines, Angles, and Triangles', 'math-lines-angles-and-triangles'),
  (18, 'Right Triangles and Trigonometry', 'math-right-triangles-and-trigonometry'),
  (19, 'Circles', 'math-circles')
) as t (n, title, slug)
cross join (values ('books'), ('sqb')) as c (collection);

insert into public.modules (set_id, module_number, tier, time_limit_sec, sort_order)
select s.id, 1, 'standard', null, 1
from public.question_sets s
where s.kind = 'topic' and not exists (select 1 from public.modules m where m.set_id = s.id);

-- Import: the same as 0017, plus typed answers ("type": "spr", "accepted": [...]).
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
  v_type text;
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
    v_type := coalesce(nullif(v_item->>'type', ''), 'mcq');
    if coalesce(trim(v_item->>'source'), '') = '' or coalesce(trim(v_item->>'prompt'), '') = ''
       or coalesce(trim(v_item->>'answer'), '') = '' or jsonb_typeof(v_item->'choices') <> 'array'
       or (v_item->>'difficulty') not in ('easy', 'medium', 'hard')
       or v_type not in ('mcq', 'spr')
       or (v_type = 'spr' and (v_set.subject <> 'math' or jsonb_array_length(v_item->'choices') > 0))
       or (v_type = 'mcq' and jsonb_array_length(v_item->'choices') < 2)
       or (v_item ? 'accepted' and jsonb_typeof(v_item->'accepted') <> 'array') then
      raise exception 'Question % is incomplete.', coalesce(v_item->>'source', '?') using errcode = '22023';
    end if;
    continue when exists (select 1 from public.questions where source = v_item->>'source');
    insert into public.questions (external_id, subject, skill_id, difficulty, type, passage, prompt, choices, image_path, status, source)
    values (
      case v_set.subject when 'english' then 'eng' else 'math' end || '-' || to_char(now(), 'YYMMDD') || '-'
        || substr(md5(gen_random_uuid()::text), 1, 10),
      v_set.subject,
      (select id from public.skills where slug = v_item->>'skill'),
      v_item->>'difficulty', v_type, nullif(v_item->>'passage', ''), v_item->>'prompt',
      v_item->'choices',
      nullif(v_item->>'image', ''), 'draft', v_item->>'source'
    )
    returning id into v_qid;
    insert into public.question_answers (question_id, correct_answer, accepted_answers, explanation)
    values (
      v_qid, v_item->>'answer',
      coalesce((select array_agg(a) from jsonb_array_elements_text(coalesce(v_item->'accepted', '[]'::jsonb)) a), '{}'),
      nullif(v_item->>'explanation', '')
    );
    insert into public.module_questions (module_id, question_id, position) values (v_module, v_qid, v_next);
    v_next := v_next + 1;
    v_added := v_added + 1;
  end loop;
  return v_added;
end;
$$;
