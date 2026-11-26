# Results

Finished and unfinished tests and practices.

- `/[subject]/results`: every test and practice the student started, finished or not, newest first, as cards.
- `/[subject]/results/[attemptId]` (`ResultDetailPage` loads, `ResultsView` draws), laid out like the College Board report
  (owner request, 25 Nov 2026): header with "Delete this attempt" (`remove_attempt`, migration 0013), the score on a
  200–800 dial with module counts, a breakdown per content area (seven-block bars, notes from
  `SUBJECTS[subject].domainNotes`), and "Review your answers": All / Incorrect / Skipped / Marked tabs over one grid
  of question squares per module. A square or "Review questions" opens the shared Bluebook review screen
  (`ReviewScreen` in core/question) with a Show correct answer switch and the explanation.
- Data: `get_test_results` (migrations 0007 and 0013).

Results list (migration 0019): `listAttempts` calls `list_my_attempts`; `cardView` in schema.ts decides what each card shows (tested in cards.test.ts). `retakeAttempt` starts the same test, monthly set, or topic range again under the same name. Correct counts arrive only for finished attempts.
