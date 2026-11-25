import { SUBJECTS, type SubjectSlug } from "./subjects";

/**
 * Settings for topic practice, shared by the Topics page and the practice screen.
 * Change a default here and both follow.
 */

export type Difficulty = "all" | "easy" | "medium" | "hard";
export type CheckMode = "each" | "end";

export const DIFFICULTIES: readonly Difficulty[] = ["all", "easy", "medium", "hard"];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  all: "All levels",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Quick choices for "How many questions". Students can also type their own number. */
export const PRACTICE_SIZES = [10, 20, 25] as const;
export const DEFAULT_PRACTICE_SIZE = 20;
export const MAX_PRACTICE_SIZE = 200;

export function isDifficulty(v: unknown): v is Difficulty {
  return typeof v === "string" && (DIFFICULTIES as readonly string[]).includes(v);
}

/** "Easy, #1–25" or "All levels, #26–50"; a single question reads "#7". */
export function rangeLabel(o: { difficulty: Difficulty; from: number; to: number }): string {
  const range = o.from === o.to ? `#${o.from}` : `#${o.from}–${o.to}`;
  return `${DIFFICULTY_LABEL[o.difficulty]}, ${range}`;
}

/** Minutes for `count` questions at the real test's pace (English: 32 minutes for 27 questions). */
export function satPaceMinutes(subject: SubjectSlug, count: number): number {
  const s = SUBJECTS[subject];
  return Math.max(1, Math.ceil((count * s.minutesPerModule) / s.questionsPerModule));
}

/** Seconds per question at the real test's pace, for the hint under the timer. */
export function satPaceSeconds(subject: SubjectSlug): number {
  const s = SUBJECTS[subject];
  return Math.round((s.minutesPerModule * 60) / s.questionsPerModule);
}
