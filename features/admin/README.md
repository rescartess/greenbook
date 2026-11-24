# features/admin

The owner's admin area at `/admin`. Only accounts with role `admin` can open it: everyone else gets "not found",
and the database rules block their reads anyway.

- `/admin`: all tests, including drafts.
- `/admin/tests/[setId]`: a test's modules and questions with topic, difficulty and answer.
- `/admin/questions/[externalId]`: one question exactly as students see it, plus the answer and explanation, with Previous/Next.

Coming next (milestone 5): editing questions, adding questions, publishing tests, bulk upload.
