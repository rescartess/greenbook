# features/test-runner

The timed, Bluebook-style test screen at `/test/[attemptId]`.

- The database does the real work (`supabase/migrations/..._test_engine.sql`): it hands out questions without
  answers, keeps the deadline, refuses late answers, grades, and picks the easier or harder module 2.
- `TestRunner.tsx` shows one module: timer (can be hidden), cross-out tool, mark for review, question map,
  review page, Back/Next. Every change saves right away, one save at a time, with retries.
- When time runs out the screen finishes the module itself; the server would anyway.
- After the last module it goes to `/[subject]/results/[attemptId]`.

Tools (chosen per subject in `core/config/subjects.ts`):
- Highlight (English): select words in the passage; drawn with the browser's highlight feature, kept for the module.
- Reference (Math): the formula sheet.
- Calculator (Math): Desmos, shown only when `NEXT_PUBLIC_DESMOS_API_KEY` is set in Vercel.
- Cross out (ABC): strike through choices you've ruled out.
