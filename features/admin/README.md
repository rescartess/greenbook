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

## Students (owner request, 27 Nov 2026)

- `/admin/students`: totals (students, new this week, active today and this week, time practicing, questions
  answered), then everyone with search, sort (last active, most time, most answered, newest, name) and
  "Download list" (a CSV file for Excel or Google Sheets). Phones get one card per student.
- `/admin/students/[id]`: photo, email, how they sign in (Google, class code, email link), bio, joined, last
  active, target score, SAT date; time, answers, accuracy, finished vs not finished; English and Math side by
  side (best and latest full test); the last 30 days as bars; topics weakest first (3+ answers); recent tests and
  practices. "Public profile" opens what other students see.
- Data: `admin_list_students` and `admin_get_student` (migration 0026), admin only, read only, never answers.
  Labels in `student-format.ts`, times in Tashkent time.
- The top menu (`AdminNav`): Students, Tests, Import.

## Backup (28 Nov 2026)
`/admin/backup`: one button downloads `QuantumTest backup <date>.zip` with every question, answer, explanation, picture, topic and full test (no student data).
- `<Subject> topics (QuantumTest).json`, `<Subject> topics (SQB).json`, `<Subject> full tests.json`: import files that `/admin/import` loads back (topics first, then tests; tests come back hidden, publish the ones listed in manifest.json).
- `raw.json`: the exact rows (ids, drafts, questions in no set). `manifest.json`: counts and what was published. `README.txt`: restore steps.
- `backup.ts` arranges the rows (tested in `backup.test.ts`, which also checks the files pass the import checker); `BackupPanel.tsx` reads the tables 1,000 rows at a time, copies the pictures and zips with fflate.
