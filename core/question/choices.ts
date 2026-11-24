export type QuestionChoice = { id: string; text: string };

/** Answer choices as stored in questions.choices: [{ id: "A", text: "..." }, ...]. Anything else gives []. */
export function parseChoices(value: unknown): QuestionChoice[] {
  if (!Array.isArray(value)) return [];
  const choices: QuestionChoice[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return [];
    const { id, text } = item as Record<string, unknown>;
    if (typeof id !== "string" || typeof text !== "string") return [];
    choices.push({ id, text });
  }
  return choices;
}
