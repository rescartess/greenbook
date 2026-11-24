# features/results

- `/[subject]/results`: the student's finished tests, newest first.
- `/[subject]/results/[attemptId]`: score (labelled estimated while `ESTIMATED_SCORES` is on), each module,
  accuracy by area, and every question with the student's answer, the right answer and the explanation.
  Data comes from the database function `get_test_results`, which only answers for finished tests.
