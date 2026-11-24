import { parseChoices, type CheckFeedback, type QuestionChoice } from "@/core/question";

export type Mistake = {
  id: string;
  passage: string | null;
  prompt: string;
  choices: QuestionChoice[];
  type: string;
  skill: string;
  domain: string;
  timesWrong: number;
  streak: number;
};

export type RetryFeedback = CheckFeedback & { mastered: boolean };

const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

export function parseMistakes(json: unknown): Mistake[] {
  return (Array.isArray(json) ? json : []).map((raw) => {
    const m = obj(raw);
    return {
      id: str(m.id),
      passage: typeof m.passage === "string" ? m.passage : null,
      prompt: str(m.prompt),
      choices: parseChoices(m.choices),
      type: str(m.type, "mcq"),
      skill: str(m.skill, "Other"),
      domain: str(m.domain, "Other"),
      timesWrong: typeof m.timesWrong === "number" ? m.timesWrong : 1,
      streak: typeof m.streak === "number" ? m.streak : 0,
    };
  });
}

export function parseRetry(json: unknown): RetryFeedback {
  const f = obj(json);
  return {
    answer: typeof f.answer === "string" ? f.answer : null,
    isCorrect: f.isCorrect === true,
    correctAnswer: typeof f.correctAnswer === "string" ? f.correctAnswer : null,
    explanation: typeof f.explanation === "string" ? f.explanation : null,
    mastered: f.mastered === true,
  };
}

/** Groups mistakes by area, then topic, keeping the database's order. */
export function groupMistakes(list: Mistake[]) {
  const areas: { area: string; topics: { topic: string; items: Mistake[] }[] }[] = [];
  for (const m of list) {
    let area = areas.find((a) => a.area === m.domain);
    if (!area) areas.push((area = { area: m.domain, topics: [] }));
    let topic = area.topics.find((t) => t.topic === m.skill);
    if (!topic) area.topics.push((topic = { topic: m.skill, items: [] }));
    topic.items.push(m);
  }
  return areas;
}
