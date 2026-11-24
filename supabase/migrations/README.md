# Migrations

Numbered .sql files that create and change the database. They are the ONLY way the database changes, and they run in name order.

- 0001 profiles, sign-up trigger, is_admin()
- 0002 content tables (questions, answers, sets, modules, score tables) and their security rules
- 0003 activity tables (attempts, responses, progress), read-own-rows rules
- 0004 official SAT domains and skills

Never edit a migration that has already run. Add a new file instead.
- 0005 move is_admin() and the sign-up trigger function into a private schema (not callable from the web)
- 0006 indexes on every foreign key; admin write rules split so each read checks one rule

## Applying a migration
Each file is applied to the live project (greenbook, ref `pgpotvnyomwrlmnhzcmy`, Frankfurt) with Claude's Supabase connector, then the security and performance advisors are re-run.
After a migration, regenerate `core/db/types.ts`.
- 0007 test engine: start_full_test, get_test_state, save_response, finish_module, get_test_results (server keeps the clock, grades, picks the easier/harder module 2, records mistakes)
- 0008 ESTIMATED score tables (replace the rows when real tables exist)

Automated checks for the database live in `tests/db/` and run with `npm test`: every migration is applied to a throwaway in-memory Postgres and the rules are tested as a student and as an admin.
