import { SUBJECTS } from "@/core/config/subjects";
import { DevShell, PageTitle } from "@/core/shell";
import type { AttemptSummary, ResultQuestion, TestResults } from "../schema";
import { ResultsView } from "./ResultDetailPage";
import { AttemptsView } from "./ResultsPage";

/** Local-only previews of Results with made-up numbers. */
const mod = (number: number | null, total: number, answered: number, correct: number | null, tier: string | null = null) => ({ number, tier, total, answered, correct });
const SAMPLE: AttemptSummary[] = [
  { id: "a1", setId: "s", setTitle: "Boundaries", setKind: "topic", name: "Monday boundaries", status: "in_progress", options: { difficulty: "easy", from: 21, to: 40 }, startedAt: "2026-11-26T12:40:00Z", finishedAt: null, scaledScore: null, rawCorrect: null, modules: [mod(null, 20, 7, null)] },
  { id: "a2", setId: "s", setTitle: "Practice test 1", setKind: "full_test", name: null, status: "completed", options: null, startedAt: "2026-11-26T09:10:00Z", finishedAt: "2026-11-26T10:20:00Z", scaledScore: 560, rawCorrect: 31, modules: [mod(1, 27, 27, 17), mod(2, 27, 25, 14, "harder")] },
  { id: "a3", setId: "s", setTitle: "Inferences", setKind: "topic", name: "Inferences, hard 1–10", status: "completed", options: { difficulty: "hard", from: 1, to: 10 }, startedAt: "2026-11-25T15:05:00Z", finishedAt: "2026-11-25T15:30:00Z", scaledScore: null, rawCorrect: 6, modules: [mod(null, 10, 10, 6)] },
  { id: "a4", setId: "s", setTitle: "Practice test 2", setKind: "full_test", name: null, status: "in_progress", options: null, startedAt: "2026-11-24T11:00:00Z", finishedAt: null, scaledScore: null, rawCorrect: null, modules: [mod(1, 27, 12, null)] },
  { id: "a5", setId: "s", setTitle: "Transitions", setKind: "topic", name: null, status: "completed", options: { difficulty: "all", from: 1, to: 20 }, startedAt: "2026-11-23T08:00:00Z", finishedAt: "2026-11-23T08:30:00Z", scaledScore: null, rawCorrect: 15, modules: [mod(null, 20, 20, 15)] },
];

/** Local-only previews of Results with made-up numbers. */
export function ResultsPreview() {
  return (
    <DevShell>
      <PageTitle title="Results" subtitle={`${SUBJECTS.english.name}. Every attempt, kept.`} />
      <AttemptsView subject="english" attempts={SAMPLE} />
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
