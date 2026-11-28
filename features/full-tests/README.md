# Full tests

Full tests, one subject at a time: module 1, then module 2, scored 200 to 800 (estimated, see `private.estimate_score`).

- Adaptive tests (both an easier and a harder module 2) appear in the "Adaptive full test" month picker: module 1 decides which module 2 the student gets.
- Fixed tests (one module 2, e.g. "2025 September A") appear below it, newest month first. Admins also see drafts.
- Starts or resumes a test through `start_full_test`, then opens `/test/[attemptId]`.
- Page: `app/(app)/[subject]/full-tests/page.tsx`. Switch: `full-tests` in `core/config/features.ts`. Preview: /dev/pages/full-tests.

## Parts of a test (28 Nov 2026)
Start exam opens a window with three choices: Full test, Module 1 only, Module 2 only (Hard or Easy
for an adaptive test). They call `start_test_part` (migration 0028), which stores the choice in
`attempts.part`. A single module ends after itself and has no 200–800 score. If the test is already
running, the button says Continue exam and resumes it without the window.
