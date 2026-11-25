import { isDifficulty, type CheckMode, type Difficulty } from "@/core/config/practice";
import { parseChoices, type CheckFeedback, type QuestionChoice } from "@/core/question";

export { DIFFICULTY_LABEL, isDifficulty, rangeLabel, type CheckMode, type Difficulty } from "@/core/config/practice";

/** What the student picked on the topic page. Null for older practices and monthly sets. */
export type PracticeOptions = {
  difficulty: Difficulty;
  from: number;
  to: number;
  minutes: number | null;
};

export type PracticeQuestion = {
  id: string;
  position: number;
  type: string;
  passage: string | null;
  prompt: string;
  choices: QuestionChoice[];
  skill: string | null;
  difficulty: string | null;
  /** The student's current pick (saved, maybe not checked yet). */
  answer: string | null;
  marked: boolean;
  eliminated: string[];
  /** Set once the question is checked, and for every question after the practice is finished. */
  feedback: CheckFeedback | null;
};

export type PracticeState = {
  attemptId: string;
  attemptModuleId: string;
  status: "in_progress" | "completed" | "abandoned";
  setId: string | null;
  kind: "topic" | "monthly" | null;
  title: string;
  subject: string;
  checkMode: CheckMode;
  options: PracticeOptions | null;
  deadlineAt: string | null;
  serverNow: string;
  /** Questions after this range at the same level, for "Do the next ...". */
  moreAfter: number;
  questions: PracticeQuestion[];
};

const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const str = (v: unknown) => (typeof v === "string" ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function parseFeedback(v: unknown): CheckFeedback | null {
  if (!v || typeof v !== "object") return null;
  const f = obj(v);
  return {
    answer: str(f.answer),
    isCorrect: f.isCorrect === true,
    correctAnswer: str(f.correctAnswer),
    explanation: str(f.explanation),
  };
}

export function parseOptions(v: unknown): PracticeOptions | null {
  const o = obj(v);
  const from = num(o.from);
  const to = num(o.to);
  if (!isDifficulty(o.difficulty) || from === null || to === null) return null;
  return { difficulty: o.difficulty, from, to, minutes: num(o.minutes) };
}

export function parsePracticeState(json: unknown): PracticeState {
  const root = obj(json);
  if (!str(root.attemptId)) throw new Error("The practice could not be loaded.");
  return {
    attemptId: str(root.attemptId)!,
    attemptModuleId: str(root.attemptModuleId) ?? "",
    status: root.status === "completed" ? "completed" : root.status === "abandoned" ? "abandoned" : "in_progress",
    setId: str(root.setId),
    kind: root.kind === "topic" || root.kind === "monthly" ? root.kind : null,
    title: str(root.title) ?? "Practice",
    subject: str(root.subject) ?? "english",
    checkMode: root.checkMode === "end" ? "end" : "each",
    options: parseOptions(root.options),
    deadlineAt: str(root.deadlineAt),
    serverNow: str(root.serverNow) ?? new Date().toISOString(),
    moreAfter: num(root.moreAfter) ?? 0,
    questions: (Array.isArray(root.questions) ? root.questions : []).map((raw, i) => {
      const q = obj(raw);
      return {
        id: str(q.id) ?? String(i),
        position: num(q.position) ?? i + 1,
        type: str(q.type) ?? "mcq",
        passage: str(q.passage),
        prompt: str(q.prompt) ?? "",
        choices: parseChoices(q.choices),
        skill: str(q.skill),
        difficulty: str(q.difficulty),
        answer: str(q.answer),
        marked: q.marked === true,
        eliminated: Array.isArray(q.eliminated) ? q.eliminated.filter((e): e is string => typeof e === "string") : [],
        feedback: parseFeedback(q.feedback),
      };
    }),
  };
}

export type Score = { correct: number; incorrect: number; skipped: number; total: number; percent: number };

/** Counts for the "Practice complete" screen. Skipped means never answered. */
export function scorePractice(questions: readonly Pick<PracticeQuestion, "answer" | "feedback">[]): Score {
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;
  for (const q of questions) {
    const answer = q.feedback?.answer ?? q.answer;
    if (!answer) skipped++;
    else if (q.feedback?.isCorrect) correct++;
    else incorrect++;
  }
  const total = questions.length;
  return { correct, incorrect, skipped, total, percent: total === 0 ? 0 : Math.round((correct / total) * 100) };
}

/** Plain-language reasons for a failed save or check, by the database's error code. */
export function practiceErrorMessage(code: string | undefined): { message: string; reload: boolean } {
  switch (code) {
    case "P0004":
      return { message: "Time is up for this practice.", reload: true };
    case "P0003":
      return { message: "This practice is already finished.", reload: true };
    case "P0007":
      return { message: "This practice was paused in another tab. Reloading it.", reload: true };
    case "P0008":
      return { message: "In this practice, answers are checked at the end.", reload: true };
    case "42501":
      return { message: "You’ve been signed out. Sign in again to keep going.", reload: true };
    default:
      return { message: "That didn’t save. Check your connection; we’ll keep trying.", reload: false };
  }
}

export function monthLabel(isoDate: string | null): string {
  if (!isoDate) return "";
  const [y, m] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}
