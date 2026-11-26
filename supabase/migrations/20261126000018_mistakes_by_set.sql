-- 0018: Mistakes are listed by practice (the topic or test a question belongs to).
-- get_mistakes now also says which question set each mistake comes from.

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
    'correctAnswer', qa.correct_answer, 'explanation', qa.explanation,
    'setId', qs.id, 'setTitle', qs.title, 'setKind', qs.kind, 'collection', qs.collection
  ) order by d.sort_order nulls last, s.sort_order nulls last, p.last_seen_at desc), '[]'::jsonb)
  from public.question_progress p
  join public.questions q on q.id = p.question_id and q.status <> 'retired' and q.subject = p_subject
  left join public.question_answers qa on qa.question_id = q.id
  left join public.skills s on s.id = q.skill_id
  left join public.domains d on d.id = s.domain_id
  left join lateral (
    -- The set the question lives in (a topic first, if it is in more than one).
    select x.id, x.title, x.kind, x.collection
    from public.module_questions mq
    join public.modules m on m.id = mq.module_id
    join public.question_sets x on x.id = m.set_id
    where mq.question_id = q.id
    order by (x.kind = 'topic') desc, x.sort_order nulls last, x.created_at
    limit 1
  ) qs on true
  where p.user_id = (select auth.uid()) and p.times_wrong > 0 and not p.mastered;
$$;
