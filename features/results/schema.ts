import { parseChoices, type QuestionChoice } from "@/core/question";

export type ResultQuestion = {
  id: string;
  position: number;
  passage: string | null;
  prompt: string;
  choices: QuestionChoice[];
  skill: string;
  domain: string;
  difficulty: string;
  answer: string | null;
  isCorrect: boolean;
  correctAnswer: string | null;
  explanation: string | null;
  seconds: number;
};

export type TestResults = {
  attemptId: string;
  title: string;
  subject: string;
  finishedAt: string | null;
  rawCorrect: number;
  scaledScore: number | null;
  modules: { number: number; tier: string; correct: number; total: number; questions: ResultQuestion[] }[];
};

const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const str = (v: unknown) => (typeof v === "string" ? v : null);
const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);

export function parseResults(json: unknown): TestResults {
  const root = obj(json);
  if (!str(root.attemptId)) throw new Error("The results could not be loaded.");
  return {
    attemptId: str(root.attemptId)!,
    title: str(root.title) ?? "Test",
    subject: str(root.subject) ?? "english",
    finishedAt: str(root.finishedAt),
    rawCorrect: num(root.rawCorrect),
    scaledScore: typeof root.scaledScore === "number" ? root.scaledScore : null,
    modules: (Array.isArray(root.modules) ? root.modules : []).map((raw) => {
      const m = obj(raw);
      return {
        number: num(m.number, 1),
        tier: str(m.tier) ?? "standard",
        correct: num(m.correct),
        total: num(m.total),
        questions: (Array.isArray(m.questions) ? m.questions : []).map((rq, i) => {
          const q = obj(rq);
          return {
            id: str(q.id) ?? String(i),
            position: num(q.position, i + 1),
            passage: str(q.passage),
            prompt: str(q.prompt) ?? "",
            choices: parseChoices(q.choices),
            skill: str(q.skill) ?? "Other",
            domain: str(q.domain) ?? "Other",
            difficulty: str(q.difficulty) ?? "medium",
            answer: str(q.answer),
            isCorrect: q.isCorrect === true,
            correctAnswer: str(q.correctAnswer),
            explanation: str(q.explanation),
            seconds: num(q.seconds),
          };
        }),
      };
    }),
  };
}

/** Accuracy per content area, in the order given (the official order). */
export function accuracyByArea(results: TestResults, areas: readonly string[]) {
  const all = results.modules.flatMap((m) => m.questions);
  return areas
    .map((area) => {
      const qs = all.filter((q) => q.domain === area);
      const correct = qs.filter((q) => q.isCorrect).length;
      return { area, correct, total: qs.length, percent: qs.length ? Math.round((correct / qs.length) * 100) : null };
    })
    .filter((a) => a.total > 0);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}
