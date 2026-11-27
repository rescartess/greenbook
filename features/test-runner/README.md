# features/test-runner

The timed, Bluebook-style test screen at `/test/[attemptId]`.

- The database does the real work (`supabase/migrations/..._test_engine.sql`): it hands out questions without
  answers, keeps the deadline, refuses late answers, grades, and picks the easier or harder module 2.
- `TestRunner.tsx` shows one module: timer (can be hidden), cross-out tool, mark for review, question map,
  review page, Back/Next. Every change saves right away, one save at a time, with retries.
- When time runs out the screen finishes the module itself; the server would anyway.
- After the last module it goes to `/[subject]/results/[attemptId]`. Exception (owner request 28 Nov 2026): an English
  adaptive test whose month also has a Math adaptive test goes to `/test/[attemptId]/break` instead: Bluebook's
  10-minute "Practice Test Break" (`BreakScreen` in core/question; the clock runs from when English ended). Resume
  Testing, or the clock reaching 0:00 while the page is open, starts or reopens that month's Math test
  (`startNextSection` looks the Math test up again on the server). Preview: /dev/exam/break.

Tools (chosen per subject in `core/config/subjects.ts`):
- Highlight (English): select words in the passage; drawn with the browser's highlight feature, kept for the module.
- Reference (Math): the formula sheet (`ReferencePanel` in core/question/MathTools.tsx; shared with practice).
- Calculator (Math): Desmos Graphing and Scientific (`CalculatorPanel`, shared with practice), shown only when the
  Desmos key is set in `core/config/desmos.ts`.
- Cross out (ABC): strike through choices you've ruled out.
