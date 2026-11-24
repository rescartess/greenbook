/** Small helpers for admin pages: labels and input checks. */

export function moduleLabel(moduleNumber: number, tier: string): string {
  if (moduleNumber === 1) return "Module 1";
  if (tier === "harder") return "Module 2 (harder)";
  if (tier === "easier") return "Module 2 (easier)";
  return "Module 2";
}

export function difficultyLabel(difficulty: string): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export function statusLabel(status: string): string {
  return status === "published"
    ? "Published"
    : status === "retired"
      ? "Retired"
      : "Draft";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID.test(value);

/** Question ids look like eng-pt1-m1-q01. */
export const isExternalId = (value: string) => /^[a-z0-9-]{3,64}$/.test(value);

/** A short one-line preview of long text. */
export function shorten(text: string, max = 110): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

// ---- Question editing ----

export const CHOICE_IDS = ["A", "B", "C", "D"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const STATUSES = ["draft", "published", "retired"] as const;

export type QuestionInput = {
  passage: string | null;
  prompt: string;
  choices: { id: string; text: string }[];
  correct: string;
  explanation: string | null;
  skillId: number;
  difficulty: (typeof DIFFICULTIES)[number];
  status: (typeof STATUSES)[number];
};

export type QuestionField =
  | "passage"
  | "prompt"
  | "choices"
  | "correct"
  | "explanation"
  | "skillId"
  | "difficulty"
  | "status";

export type QuestionFormState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fields: Partial<Record<QuestionField, string>>;
    };

const text = (formData: FormData, name: string) =>
  String(formData.get(name) ?? "")
    .replace(/\r\n/g, "\n")
    .trim();

/** Reads and checks the edit form. Returns the clean values or a message per field. */
export function parseQuestionForm(
  formData: FormData,
):
  | { ok: true; value: QuestionInput }
  | { ok: false; fields: Partial<Record<QuestionField, string>> } {
  const fields: Partial<Record<QuestionField, string>> = {};

  const passage = text(formData, "passage");
  const prompt = text(formData, "prompt");
  const explanation = text(formData, "explanation");
  const choices = CHOICE_IDS.map((id) => ({
    id,
    text: text(formData, `choice_${id}`),
  }));
  const correct = text(formData, "correct");
  const skillId = Number(text(formData, "skillId"));
  const difficulty = text(formData, "difficulty");
  const status = text(formData, "status");

  if (passage.length > 6000)
    fields.passage = "The passage is too long (6,000 characters at most).";
  if (!prompt) fields.prompt = "Write the question.";
  else if (prompt.length > 2000)
    fields.prompt = "The question is too long (2,000 characters at most).";

  if (choices.some((c) => !c.text))
    fields.choices = "Fill in all four choices.";
  else if (choices.some((c) => c.text.length > 600))
    fields.choices = "Each choice can be 600 characters at most.";
  else if (
    new Set(choices.map((c) => c.text.toLowerCase())).size !== choices.length
  )
    fields.choices = "Two choices are the same.";

  if (!(CHOICE_IDS as readonly string[]).includes(correct))
    fields.correct = "Pick the correct answer.";
  if (explanation.length > 3000)
    fields.explanation =
      "The explanation is too long (3,000 characters at most).";
  if (!Number.isInteger(skillId) || skillId <= 0)
    fields.skillId = "Pick a topic.";
  if (!(DIFFICULTIES as readonly string[]).includes(difficulty))
    fields.difficulty = "Pick a difficulty.";
  if (!(STATUSES as readonly string[]).includes(status))
    fields.status = "Pick a status.";

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return {
    ok: true,
    value: {
      passage: passage || null,
      prompt,
      choices,
      correct,
      explanation: explanation || null,
      skillId,
      difficulty: difficulty as QuestionInput["difficulty"],
      status: status as QuestionInput["status"],
    },
  };
}

// ---- Publishing ----

export type ModuleCheck = {
  moduleNumber: number;
  tier: string;
  questions: number;
  withoutAnswer: number;
};

/** What still blocks a test from being published. Empty list = ready. */
export function publishProblems(isAdaptive: boolean, modules: ModuleCheck[], kind: string = "full_test"): string[] {
  const problems: string[] = [];
  if (kind !== "full_test") {
    const total = modules.reduce((sum, m) => sum + m.questions, 0);
    if (total === 0) problems.push("The set has no questions yet.");
    const missing = modules.reduce((sum, m) => sum + m.withoutAnswer, 0);
    if (missing > 0) problems.push(`${missing} question${missing === 1 ? " has" : "s have"} no correct answer.`);
    return problems;
  }
  const find = (n: number, tier?: string) =>
    modules.find((m) => m.moduleNumber === n && (!tier || m.tier === tier));
  const needed: { label: string; module: ModuleCheck | undefined }[] =
    isAdaptive
      ? [
          { label: "Module 1", module: find(1) },
          { label: "Module 2 (easier)", module: find(2, "easier") },
          { label: "Module 2 (harder)", module: find(2, "harder") },
        ]
      : [
          { label: "Module 1", module: find(1) },
          { label: "Module 2", module: find(2) },
        ];
  for (const { label, module } of needed) {
    if (!module || module.questions === 0)
      problems.push(`${label} has no questions yet.`);
  }
  const missingAnswers = modules.reduce((sum, m) => sum + m.withoutAnswer, 0);
  if (missingAnswers > 0)
    problems.push(
      `${missingAnswers} question${missingAnswers === 1 ? " has" : "s have"} no correct answer.`,
    );
  return problems;
}

// ---- Bulk import ----

export type SkillRef = { id: number; name: string; slug?: string };

export type ImportItem = {
  passage: string | null;
  prompt: string;
  choices: { id: string; text: string }[];
  answer: string;
  explanation: string | null;
  skill_id: number;
  difficulty: (typeof DIFFICULTIES)[number];
};

export type ImportCheck = { items: ImportItem[]; problems: string[] };

const asText = (v: unknown) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "");

/**
 * Reads pasted JSON: a list of questions like
 * { "passage": "...", "question": "...", "choices": ["...", "...", "...", "..."], "answer": "B",
 *   "explanation": "...", "topic": "Words in Context", "difficulty": "medium" }.
 * Every problem is reported with its question number; nothing is imported unless all are fine.
 */
export function checkImport(text: string, skills: SkillRef[]): ImportCheck {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { items: [], problems: ["This isn’t valid JSON. Check for a missing comma or quote."] };
  }
  const list = Array.isArray(data) ? data : data && typeof data === "object" && Array.isArray((data as { questions?: unknown }).questions) ? (data as { questions: unknown[] }).questions : null;
  if (!list) return { items: [], problems: ["Paste a list of questions: [ {…}, {…} ]."] };
  if (list.length === 0) return { items: [], problems: ["The list is empty."] };
  if (list.length > 60) return { items: [], problems: ["Import 60 questions at most at a time."] };

  const findSkill = (value: string) => {
    const v = value.toLowerCase();
    return skills.find((s) => s.name.toLowerCase() === v || s.slug?.toLowerCase() === v || s.slug?.toLowerCase().endsWith(`-${v.replace(/\s+/g, "-")}`));
  };

  const items: ImportItem[] = [];
  const problems: string[] = [];
  list.forEach((raw, i) => {
    const n = i + 1;
    const q = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const prompt = asText(q.question ?? q.prompt);
    const rawChoices = q.choices;
    let texts: string[] = [];
    if (Array.isArray(rawChoices)) texts = rawChoices.map((c) => (typeof c === "string" ? c : asText((c as { text?: unknown })?.text)));
    else if (rawChoices && typeof rawChoices === "object") texts = CHOICE_IDS.map((id) => asText((rawChoices as Record<string, unknown>)[id]));
    texts = texts.map((t) => t.trim());
    const answer = asText(q.answer).toUpperCase();
    const skill = findSkill(asText(q.topic ?? q.skill));
    const difficulty = (asText(q.difficulty) || "medium").toLowerCase();

    const mine: string[] = [];
    if (!prompt) mine.push("no question text");
    if (texts.length !== 4 || texts.some((t) => !t)) mine.push("needs exactly four choices");
    if (!(CHOICE_IDS as readonly string[]).includes(answer)) mine.push("answer must be A, B, C or D");
    if (!skill) mine.push(q.topic || q.skill ? `unknown topic “${asText(q.topic ?? q.skill)}”` : "no topic");
    if (!(DIFFICULTIES as readonly string[]).includes(difficulty)) mine.push("difficulty must be easy, medium or hard");
    if (mine.length) {
      problems.push(`Question ${n}: ${mine.join(", ")}.`);
      return;
    }
    items.push({
      passage: asText(q.passage) || null,
      prompt,
      choices: CHOICE_IDS.map((id, j) => ({ id, text: texts[j] })),
      answer,
      explanation: asText(q.explanation) || null,
      skill_id: skill!.id,
      difficulty: difficulty as ImportItem["difficulty"],
    });
  });
  return { items: problems.length ? [] : items, problems };
}

/** "2025-11-01" -> "November 2025" */
export function monthName(isoDate: string): string {
  const [y, m] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}
