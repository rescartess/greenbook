import { parseChoices, type CheckFeedback, type QuestionChoice } from "@/core/question";

export type PracticeQuestion = {
  id: string;
  position: number;
  type: string;
  passage: string | null;
  prompt: string;
  choices: QuestionChoice[];
  skill: string | null;
  feedback: CheckFeedback | null;
};

export type PracticeState = {
  attemptId: string;
  attemptModuleId: string;
  status: "in_progress" | "completed";
  title: string;
  subject: string;
  questions: PracticeQuestion[];
};

const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const str = (v: unknown) => (typeof v === "string" ? v : null);

export function parseFeedback(v: unknown): CheckFeedback | null {
  if (!v || typeof v !== "object") return null;
  const f = obj(v);
  return { answer: str(f.answer), isCorrect: f.isCorrect === true, correctAnswer: str(f.correctAnswer), explanation: str(f.explanation) };
}

export function parsePracticeState(json: unknown): PracticeState {
  const root = obj(json);
  if (!str(root.attemptId)) throw new Error("The practice could not be loaded.");
  return {
    attemptId: str(root.attemptId)!,
    attemptModuleId: str(root.attemptModuleId) ?? "",
    status: root.status === "completed" ? "completed" : "in_progress",
    title: str(root.title) ?? "Practice",
    subject: str(root.subject) ?? "english",
    questions: (Array.isArray(root.questions) ? root.questions : []).map((raw, i) => {
      const q = obj(raw);
      return {
        id: str(q.id) ?? String(i),
        position: typeof q.position === "number" ? q.position : i + 1,
        type: str(q.type) ?? "mcq",
        passage: str(q.passage),
        prompt: str(q.prompt) ?? "",
        choices: parseChoices(q.choices),
        skill: str(q.skill),
        feedback: parseFeedback(q.feedback),
      };
    }),
  };
}

export function monthLabel(isoDate: string | null): string {
  if (!isoDate) return "";
  const [y, m] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}
