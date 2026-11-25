# Migrations

Numbered .sql files that create and change the database. They are the ONLY way the database changes, and they run in name order.

- 0001 profiles, sign-up trigger, is_admin()
- 0002 content tables (questions, answers, sets, modules, score tables) and their security rules
- 0003 activity tables (attempts, responses, progress), read-own-rows rules
- 0004 official SAT domains and skills

Never edit a migration that has already run. Add a new file instead.
- 0005 move is_admin() and the sign-up trigger function into a private schema (not callable from the web)
- 0006 indexes on every foreign key; admin write rules split so each read checks one rule
- 0011 pause and exit: pause_test ("Save and exit" stops the clock; opening the test restarts it with the time left; no answers while paused), abandon_test ("Delete and exit" marks the attempt abandoned)

## Applying a migration
Each file is applied to the live project (greenbook, ref `pgpotvnyomwrlmnhzcmy`, Frankfurt) with Claude's Supabase connector, then the security and performance advisors are re-run.
After a migration, regenerate `core/db/types.ts`.
- 0007 test engine: start_full_test, get_test_state, save_response, finish_module, get_test_results (server keeps the clock, grades, picks the easier/harder module 2, records mistakes)
- 0008 ESTIMATED score tables (replace the rows when real tables exist)

Automated checks for the database live in `tests/db/` and run with `npm test`: every migration is applied to a throwaway in-memory Postgres and the rules are tested as a student and as an admin.
- 0009 admin tools: admin_create_test, admin_add_questions (all-or-nothing), admin_remove_from_module, admin_move_in_module (run with the admin's own rights)
- 0010 practice and mistakes: start_practice, get_practice_state, check_practice_answer (instant feedback), finish_practice, get_mistakes, retry_mistake (two right in a row clears it), admin_create_set (topic/monthly). Practice only grades questions from published topic/monthly sets or the student's own mistakes, so full-test answers stay secret.
- 0012 topic practice: the ten English topics (sets of kind 'topic', hidden until published), question_sets.sort_order/description, attempts.check_mode ('each' or 'end') and attempts.options. New: list_topics, get_topic, start_topic_practice (level, range, check mode, optional timer; same fixed order for everyone), save_practice_response. Re-created: check_practice_answer (refused in check-at-the-end practices, while paused, after time is up), finish_practice (grades unchecked answers), get_practice_state (picks, marks, clock, options; all answers after finishing).
- 0013 results and review: get_test_results adds each question's Mark for Review flag, type and startedAt; start_topic_practice allows up to 600 questions; remove_attempt ("Delete this attempt": a finished test is marked abandoned and leaves results and the dashboard).

## About the security advisor
It lists the student-facing functions (start_full_test, save_response, finish_module, get_test_state,
get_test_results, start_practice, get_practice_state, check_practice_answer, finish_practice, get_mistakes,
retry_mistake, list_topics, get_topic, start_topic_practice, save_practice_response, remove_attempt) as "signed-in users can execute a SECURITY DEFINER function". That is on purpose: they are the
only way students write activity, and each one checks the caller owns the attempt before doing anything.
Helper functions live in the `private` schema and can't be called from the website.
