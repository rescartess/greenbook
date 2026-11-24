-- 0008 ESTIMATED score tables (owner approved 25 Nov 2026 until real tables are added).
-- Raw score = correct answers in module 1 + module 2. Students on the harder
-- module 2 can reach 800; the easier module 2 tops out lower, like the real test.
-- Replace these rows (not this file) when the owner has better tables; the
-- results page labels every score "estimated" while ESTIMATED_SCORES is on in core/config/subjects.ts.

insert into public.score_tables (subject, tier, raw_correct, scaled_score)
select 'english', 'harder', r, least(800, greatest(200, (round((200 + 600 * power(r / 54.0, 0.9)) / 10) * 10)::int))
from generate_series(0, 54) r
union all
select 'english', 'easier', r, least(800, greatest(200, (round((200 + 430 * power(r / 54.0, 1.05)) / 10) * 10)::int))
from generate_series(0, 54) r
union all
select 'math', 'harder', r, least(800, greatest(200, (round((200 + 600 * power(r / 44.0, 0.9)) / 10) * 10)::int))
from generate_series(0, 44) r
union all
select 'math', 'easier', r, least(800, greatest(200, (round((200 + 440 * power(r / 44.0, 1.05)) / 10) * 10)::int))
from generate_series(0, 44) r
on conflict (subject, tier, raw_correct) do nothing;
