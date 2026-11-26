import { numbersText } from "@/core/config/practice";
import { parseChoices, type QuestionChoice } from "@/core/question";

export type ResultQuestion = {
  id: string;
  position: number;
  passage: string | null;
  image: string | null;
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
  marked: boolean;
  type: string;
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
            image: str(q.image),
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
            marked: q.marked === true,
            type: str(q.type) ?? "mcq",
          };
        }),
      };
    }),
  };
}

/** How many of `segments` blocks to fill for a share right (the breakdown bars). */
export function filledSegments(correct: number, total: number, segments = 7): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * segments);
}

/** Module heading: "Module 1", "Module 2 (harder)". */
export function moduleLabel(m: { number: number; tier: string }): string {
  return `Module ${m.number}${m.number === 2 && m.tier !== "standard" ? ` (${m.tier})` : ""}`;
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

// ---- The Results list: every finished or unfinished test and practice (migration 0019) ----

export type AttemptModule = { number: number | null; tier: string | null; total: number; answered: number; correct: number | null };

export type AttemptSummary = {
  id: string;
  setId: string;
  setTitle: string;
  setKind: "full_test" | "topic" | "monthly";
  name: string | null;
  status: "in_progress" | "completed";
  options: { difficulty: string; from: number; to: number } | null;
  startedAt: string;
  finishedAt: string | null;
  scaledScore: number | null;
  rawCorrect: number | null;
  modules: AttemptModule[];
};

export function parseAttempts(json: unknown): AttemptSummary[] {
  return (Array.isArray(json) ? json : []).flatMap((raw) => {
    const a = obj(raw);
    const id = str(a.id);
    const setId = str(a.setId);
    const kind = a.setKind;
    if (!id || !setId || (kind !== "full_test" && kind !== "topic" && kind !== "monthly")) return [];
    const o = a.options && typeof a.options === "object" ? obj(a.options) : null;
    return [
      {
        id,
        setId,
        setTitle: str(a.setTitle) ?? "Practice",
        setKind: kind,
        name: str(a.name),
        status: a.status === "completed" ? "completed" : "in_progress",
        options: o && typeof o.from === "number" && typeof o.to === "number" ? { difficulty: str(o.difficulty) ?? "all", from: o.from, to: o.to } : null,
        startedAt: str(a.startedAt) ?? "",
        finishedAt: str(a.finishedAt),
        scaledScore: typeof a.scaledScore === "number" ? a.scaledScore : null,
        rawCorrect: typeof a.rawCorrect === "number" ? a.rawCorrect : null,
        modules: (Array.isArray(a.modules) ? a.modules : []).map((m) => {
          const mm = obj(m);
          return {
            number: typeof mm.number === "number" ? mm.number : null,
            tier: str(mm.tier),
            total: num(mm.total),
            answered: num(mm.answered),
            correct: typeof mm.correct === "number" ? mm.correct : null,
          };
        }),
      },
    ];
  });
}

const LEVEL: Record<string, string> = { all: "All levels", easy: "Easy", medium: "Medium", hard: "Hard" };

export type CardView = {
  title: string;
  subtitle: string;
  finished: boolean;
  stats: { label: string; value: string; of: string | null }[];
  rows: { label: string; value: string; share: number }[];
  primary: { label: string; href: string };
  canRetake: boolean;
};

/** What one card on the Results page shows. Pure, so it is unit-tested. */
export function cardView(a: AttemptSummary, subject: string): CardView {
  const finished = a.status === "completed";
  const total = a.modules.reduce((s, m) => s + m.total, 0);
  const answered = a.modules.reduce((s, m) => s + m.answered, 0);
  const correct = a.modules.reduce((s, m) => s + (m.correct ?? 0), 0);
  const range = a.options ? numbersText(a.options.from, a.options.to) : "";
  const kindLabel =
    a.setKind === "full_test" ? "Full test" : a.setKind === "monthly" ? "Monthly set" : `Topic: ${a.setTitle}`;

  const stats: CardView["stats"] = !finished
    ? [
        { label: "Answered", value: String(answered), of: `of ${total}` },
        { label: "Left", value: String(Math.max(0, total - answered)), of: null },
      ]
    : a.setKind === "full_test" && a.scaledScore !== null
      ? [
          { label: "Final score", value: String(a.scaledScore), of: "of 800" },
          { label: "Final result", value: String(a.rawCorrect ?? correct), of: `of ${total}` },
        ]
      : [
          { label: "Final result", value: String(correct), of: `of ${total}` },
          { label: "Accuracy", value: `${total ? Math.round((correct / total) * 100) : 0}%`, of: null },
        ];

  const rows = a.modules.map((m) => {
    const label =
      m.number !== null
        ? `Module ${m.number}${m.tier === "harder" ? " (harder)" : m.tier === "easier" ? " (easier)" : ""}`
        : a.options
          ? `${LEVEL[a.options.difficulty] ?? "Questions"}, ${range}`
          : "Questions";
    const done = finished ? (m.correct ?? 0) : m.answered;
    return { label, value: `${done}/${m.total}`, share: m.total ? done / m.total : 0 };
  });

  const primary = finished
    ? { label: "See details", href: a.setKind === "full_test" ? `/${subject}/results/${a.id}` : `/practice/${a.id}` }
    : { label: "Continue", href: a.setKind === "full_test" ? `/test/${a.id}` : `/practice/${a.id}` };

  return {
    // Names made before 27 Nov 2026 were suggested as "Boundaries, easy #1–20"; the "#" is no longer shown.
    title: a.name ? a.name.replace(/#(?=\d)/g, "") : a.setTitle,
    subtitle: a.name ? kindLabel : a.setKind === "topic" ? `Topic practice${range ? `, ${range}` : ""}` : kindLabel,
    finished,
    stats,
    rows,
    primary,
    canRetake: finished,
  };
}
