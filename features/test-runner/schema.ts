import { parseChoices, type QuestionChoice } from "@/core/question";

/** What the test screen gets from the database. Never contains answers. */
export type RunnerQuestion = {
  id: string;
  position: number;
  type: "mcq" | "spr";
  passage: string | null;
  prompt: string;
  choices: QuestionChoice[];
};

export type RunnerResponse = { answer: string | null; marked: boolean; eliminated: string[] };

export type RunningModule = {
  attemptModuleId: string;
  number: number;
  deadlineAt: string | null;
  serverNow: string;
  isLast: boolean;
};

export type TestState =
  | { status: "completed" | "abandoned"; attemptId: string; title: string; subject: string }
  | {
      status: "in_progress";
      attemptId: string;
      title: string;
      subject: string;
      module: RunningModule;
      questions: RunnerQuestion[];
      responses: Record<string, RunnerResponse>;
    };

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/** Turns the database's JSON into a checked TestState. Throws if it's unusable. */
export function parseTestState(json: unknown): TestState {
  const root = obj(json);
  const attemptId = str(root.attemptId);
  const status = str(root.status);
  if (!attemptId) throw new Error("The test could not be loaded.");
  const base = { attemptId, title: str(root.title, "Test"), subject: str(root.subject, "english") };

  if (status !== "in_progress") return { ...base, status: status === "abandoned" ? "abandoned" : "completed" };

  const m = obj(root.module);
  const questions: RunnerQuestion[] = (Array.isArray(root.questions) ? root.questions : []).map((raw, i) => {
    const q = obj(raw);
    return {
      id: str(q.id),
      position: typeof q.position === "number" ? q.position : i + 1,
      type: q.type === "spr" ? "spr" : "mcq",
      passage: typeof q.passage === "string" ? q.passage : null,
      prompt: str(q.prompt),
      choices: parseChoices(q.choices),
    };
  });

  const responses: Record<string, RunnerResponse> = {};
  for (const raw of Array.isArray(root.responses) ? root.responses : []) {
    const r = obj(raw);
    const id = str(r.questionId);
    if (!id) continue;
    responses[id] = {
      answer: typeof r.answer === "string" ? r.answer : null,
      marked: r.marked === true,
      eliminated: Array.isArray(r.eliminated) ? r.eliminated.filter((e): e is string => typeof e === "string") : [],
    };
  }

  return {
    ...base,
    status: "in_progress",
    module: {
      attemptModuleId: str(m.attemptModuleId),
      number: typeof m.number === "number" ? m.number : 1,
      deadlineAt: typeof m.deadlineAt === "string" ? m.deadlineAt : null,
      serverNow: str(m.serverNow, new Date().toISOString()),
      isLast: m.isLast === true,
    },
    questions,
    responses,
  };
}

/** 1:05:09, 31:42, 0:07 */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Plain-language reasons for a failed save, by the database's error code. */
export function saveErrorMessage(code: string | undefined): { message: string; reload: boolean } {
  switch (code) {
    case "P0004":
      return { message: "Time is up for this module.", reload: true };
    case "P0003":
      return { message: "This module is already finished.", reload: true };
    case "42501":
      return { message: "You’re signed out. Sign in again to keep going.", reload: true };
    default:
      return { message: "Your last answer didn’t save. Check your connection; we’ll keep trying.", reload: false };
  }
}
