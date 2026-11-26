import { SUBJECTS } from "@/core/config/subjects";
import { DevShell, PageTitle } from "@/core/shell";
import type { ResultRow } from "../queries";
import type { ResultQuestion, TestResults } from "../schema";
import { ResultsView } from "./ResultDetailPage";
import { ResultRows } from "./ResultsPage";

/** Local-only previews of Results with made-up numbers. */
export function ResultsPreview() {
  const rows: ResultRow[] = [
    { attemptId: "a", title: "Practice test 2", finishedAt: "2026-11-26T10:00:00Z", score: 560, raw: 31 },
    { attemptId: "b", title: "Practice test 1", finishedAt: "2026-11-20T10:00:00Z", score: 480, raw: 24 },
  ];
  return (
    <DevShell>
      <PageTitle title="Results" subtitle={`${SUBJECTS.english.name} full tests, newest first`} />
      <ResultRows subject="english" rows={rows} />
    </DevShell>
  );
}

const domains = SUBJECTS.english.domains;
const q = (i: number, ok: boolean): ResultQuestion => ({
  id: `q${i}`, position: (i % 27) + 1, passage: "A short made-up passage for the preview.", image: null,
  prompt: "Which choice completes the text with the most logical and precise word?",
  choices: [{ id: "A", text: "arbitrary" }, { id: "B", text: "internal" }, { id: "C", text: "visual" }, { id: "D", text: "accidental" }] as ResultQuestion["choices"],
  skill: "Words in Context", domain: domains[i % domains.length], difficulty: "medium",
  answer: ok ? "B" : "A", isCorrect: ok, correctAnswer: "B", explanation: null, seconds: 60, marked: false, type: "mcq",
});

export function ResultPreview() {
  const m1 = Array.from({ length: 27 }, (_, i) => q(i, i % 3 !== 0 && i % 4 !== 1));
  const m2 = Array.from({ length: 27 }, (_, i) => q(i + 27, i % 2 === 0));
  const r: TestResults = {
    attemptId: "a", title: "Practice test 2", subject: "english", finishedAt: "2026-11-26T10:00:00Z",
    rawCorrect: [...m1, ...m2].filter((x) => x.isCorrect).length, scaledScore: 560,
    modules: [
      { number: 1, tier: "standard", correct: m1.filter((x) => x.isCorrect).length, total: 27, questions: m1 },
      { number: 2, tier: "hard", correct: m2.filter((x) => x.isCorrect).length, total: 27, questions: m2 },
    ],
  };
  return (
    <DevShell>
      <ResultsView r={r} subject="english" studentName="Aziza Karimova" />
    </DevShell>
  );
}
