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
export const MAX_PRACTICE_SIZE = 600;

export function isDifficulty(v: unknown): v is Difficulty {
  return typeof v === "string" && (DIFFICULTIES as readonly string[]).includes(v);
}

/** "questions 1–25"; a single one reads "question 7". No "#" (owner request, 27 Nov 2026). */
export function numbersText(from: number, to: number): string {
  return from === to ? `question ${from}` : `questions ${from}–${to}`;
}

/** "Easy, questions 1–25" or "All levels, questions 26–50"; a single question reads "question 7". */
export function rangeLabel(o: { difficulty: Difficulty; from: number; to: number }): string {
  return `${DIFFICULTY_LABEL[o.difficulty]}, ${numbersText(o.from, o.to)}`;
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

/** Topic collections on the Topics page: the owner's own questions, and College Board's SAT Suite Question Bank. */
export type Collection = "books" | "sqb";
export const COLLECTION_LABEL: Record<Collection, string> = { books: "FreedomPrep", sqb: "SQB" };
/** Credit shown wherever SQB questions appear (the owner has College Board's permission, 26 Nov 2026). */
export const SQB_CREDIT =
  "Questions, answers and explanations © College Board, from the SAT Suite Question Bank.";
