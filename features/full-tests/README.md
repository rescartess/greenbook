# Full tests

Adaptive full tests, one subject at a time: module 1, then an easier or harder module 2, scored 200 to 800.

- Lists tests (admins also see drafts), starts or resumes them through `start_full_test`, then opens `/test/[attemptId]`.
- Page: `app/(app)/[subject]/full-tests/page.tsx`. Switch: `full-tests` in `core/config/features.ts`.
