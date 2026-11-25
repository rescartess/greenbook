# Topics

Practice one question type at a time (owner request, 25 Nov 2026).

- `/[subject]/topics`: every topic as a card with its easy / medium / hard counts and the student's progress
  (`list_topics`). Topics without questions show "Questions coming soon"; unpublished ones only show to admins.
- `/[subject]/topics/[setId]`: the setup page (`TopicSetup`). Pick a level (or all), how many at a time, which range
  (#1–20, #21–40... with progress per range), check as you go or at the end, and an optional timer at SAT pace.
  Unfinished practices of the topic are listed at the top with Continue.
- Starting calls the practice feature's `startTopicPractice` (passed in as a prop). The practice itself runs at
  `/practice/[attemptId]` (see `features/practice`).
- Every student gets the same questions in the same order: the order is the admin's order in the topic's module
  (`private.topic_items` in migration 0012).
- A topic is a question set of kind `topic`. The ten English topics were created by migration 0012; add questions to
  them in Admin like any set, then publish the set.
- Shared settings (levels, sizes, SAT pace) live in `core/config/practice.ts`.
