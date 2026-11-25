# Results

Finished full tests.

- `/[subject]/results`: the student's finished tests, newest first.
- `/[subject]/results/[attemptId]` (`ResultDetailPage` loads, `ResultsView` draws), laid out like the College Board report
  (owner request, 25 Nov 2026): header with "Delete this attempt" (`remove_attempt`, migration 0013), the score on a
  200–800 dial with module counts, a breakdown per content area (seven-block bars, notes from
  `SUBJECTS[subject].domainNotes`), and "Review your answers": All / Incorrect / Skipped / Marked tabs over one grid
  of question squares per module. A square or "Review questions" opens the shared Bluebook review screen
  (`ReviewScreen` in core/question) with a Show correct answer switch and the explanation.
- Data: `get_test_results` (migrations 0007 and 0013).
