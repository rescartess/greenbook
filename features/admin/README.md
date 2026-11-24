# features/admin

The owner's admin area at `/admin`. Only accounts with role `admin` can open it: everyone else gets "not found",
and the database rules block their writes anyway.

- `/admin`: all tests, including drafts. "New test" creates module 1 plus an easier and a harder module 2.
- `/admin/tests/[setId]`: modules and questions with topic, difficulty and answer; move questions up/down, take
  them out of a module, add a missing module 2, publish or hide the test (publishing is refused while a module or answer is missing).
- `/admin/modules/[moduleId]/add`: write one new question with a live preview.
- `/admin/modules/[moduleId]/import`: paste a JSON list; everything is checked first and nothing is added unless all pass.
- `/admin/questions/[externalId]` and `/edit`: preview and edit one question.

Writes go through database functions (`supabase/migrations/..._admin_tools.sql`) so each step is all-or-nothing.
