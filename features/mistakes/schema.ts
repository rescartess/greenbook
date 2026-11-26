import { parseChoices, type CheckFeedback, type QuestionChoice } from "@/core/question";

export type Mistake = {
  id: string;
  passage: string | null;
  image: string | null;
  prompt: string;
  choices: QuestionChoice[];
  type: string;
  skill: string;
  domain: string;
  timesWrong: number;
  streak: number;
  /** The practice (question set) it comes from; null when it isn't in any set. */
  setId: string | null;
  setTitle: string | null;
  setKind: string | null;
  collection: string | null;
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
      image: typeof m.image === "string" ? m.image : null,
      prompt: str(m.prompt),
      choices: parseChoices(m.choices),
      type: str(m.type, "mcq"),
      skill: str(m.skill, "Other"),
      domain: str(m.domain, "Other"),
      timesWrong: typeof m.timesWrong === "number" ? m.timesWrong : 1,
      streak: typeof m.streak === "number" ? m.streak : 0,
      setId: typeof m.setId === "string" ? m.setId : null,
      setTitle: typeof m.setTitle === "string" ? m.setTitle : null,
      setKind: typeof m.setKind === "string" ? m.setKind : null,
      collection: typeof m.collection === "string" ? m.collection : null,
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

/** URL key for a practice's mistakes page ("other" for questions outside any set). */
export const OTHER_KEY = "other";

export type MistakePractice = {
  key: string;
  title: string;
  /** What kind of practice it is, in plain words: "Topic", "SQB topic", "Full test"... */
  label: string;
  collection: string | null;
  items: Mistake[];
};

function practiceLabel(kind: string | null, collection: string | null): string {
  if (kind === "topic") return collection === "sqb" ? "SQB topic" : "Topic";
  if (kind === "full_test") return "Full test";
  if (kind === "monthly") return "Practice by month";
  return kind ? "Practice" : "Other questions";
}

/** Groups mistakes by the practice they come from, in the order they first appear. */
export function groupByPractice(list: Mistake[]): MistakePractice[] {
  const out: MistakePractice[] = [];
  for (const m of list) {
    const key = m.setId ?? OTHER_KEY;
    let p = out.find((x) => x.key === key);
    if (!p) {
      p = {
        key,
        title: m.setTitle ?? "Other questions",
        label: practiceLabel(m.setKind, m.collection),
        collection: m.collection,
        items: [],
      };
      out.push(p);
    }
    p.items.push(m);
  }
  return out;
}
