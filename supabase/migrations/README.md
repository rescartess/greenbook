# Migrations

Numbered .sql files that create and change the database. They are the ONLY way the database changes, and they run in name order.

- 0001 profiles, sign-up trigger, is_admin()
- 0002 content tables (questions, answers, sets, modules, score tables) and their security rules
- 0003 activity tables (attempts, responses, progress), read-own-rows rules
- 0004 official SAT domains and skills

Never edit a migration that has already run. Add a new file instead.
