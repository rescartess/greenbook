# core/question

The one way questions are drawn, used by the test screen, practice, results and the admin preview.

- `rich-text.ts` reads the question text format: `*italic*`, `**bold**`, `<u>underline</u>`, `______` blanks,
  blank line = new paragraph, `- ` lines = notes list, `| a | b |` lines = table. Nothing else, and never raw HTML.
- `RichText.tsx` draws that format; `QuestionView.tsx` lays out passage, question and choices like Bluebook.
- `choices.ts` checks the stored choice list (`[{ "id": "A", "text": "..." }]`).

To support a new text format (for example math with KaTeX), add it to `rich-text.ts` with a test, then draw it in `RichText.tsx`.
Every screen picks it up at once.

- `ExamParts.tsx` and `exam-hooks.ts` are the Bluebook exam screen pieces (bars, clock, tools, Mark for Review, ABC,
  question map, highlights). The timed test and practice both build their screens from them, so a change here shows up in both.
