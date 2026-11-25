import { isDifficulty, type CheckMode, type Difficulty } from "@/core/config/practice";

export type Level = Exclude<Difficulty, "all">;

export type TopicSummary = {
  id: string;
  title: string;
  description: string | null;
  /** False while the owner is still preparing it (only admins see it then). */
  published: boolean;
  counts: Record<Level, number>;
  total: number;
  /** Questions this student has answered at least once. */
  done: number;
  /** Practices in this topic the student hasn't finished. */
  open: number;
};

/** One question of a topic in its fixed order: its level and the student's last result. */
export type TopicItem = { level: Level; result: "correct" | "wrong" | null };

export type OpenPractice = {
  attemptId: string;
  difficulty: Difficulty;
  from: number;
  to: number;
  checkMode: CheckMode;
  answered: number;
  total: number;
};

export type TopicDetail = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  published: boolean;
  items: TopicItem[];
  open: OpenPractice[];
};

const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const str = (v: unknown) => (typeof v === "string" ? v : null);
const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : 0);
const isLevel = (v: unknown): v is Level => v === "easy" || v === "medium" || v === "hard";

export function parseTopics(json: unknown): TopicSummary[] {
  return (Array.isArray(json) ? json : []).flatMap((raw) => {
    const t = obj(raw);
    const id = str(t.id);
    if (!id) return [];
    const counts = { easy: int(t.easy), medium: int(t.medium), hard: int(t.hard) };
    return [
      {
        id,
        title: str(t.title) ?? "Topic",
        description: str(t.description),
        published: t.published === true,
        counts,
        total: counts.easy + counts.medium + counts.hard,
        done: int(t.done),
        open: int(t.open),
      },
    ];
  });
}

export function parseTopic(json: unknown): TopicDetail | null {
  const t = obj(json);
  const id = str(t.id);
  if (!id) return null;
  return {
    id,
    title: str(t.title) ?? "Topic",
    description: str(t.description),
    subject: str(t.subject) ?? "english",
    published: t.published === true,
    items: (Array.isArray(t.items) ? t.items : []).flatMap((raw) => {
      const i = obj(raw);
      if (!isLevel(i.d)) return [];
      return [{ level: i.d, result: i.r === "correct" || i.r === "wrong" ? i.r : null }];
    }),
    open: (Array.isArray(t.open) ? t.open : []).flatMap((raw) => {
      const o = obj(raw);
      const options = obj(o.options);
      const attemptId = str(o.attemptId);
      if (!attemptId) return [];
      return [
        {
          attemptId,
          difficulty: isDifficulty(options.difficulty) ? options.difficulty : "all",
          from: int(options.from) || 1,
          to: int(options.to) || int(o.total),
          checkMode: o.checkMode === "end" ? "end" : "each",
          answered: int(o.answered),
          total: int(o.total),
        },
      ];
    }),
  };
}

/** The questions a difficulty choice covers, in order (numbered from 1 within the choice). */
export function itemsFor(items: readonly TopicItem[], difficulty: Difficulty): TopicItem[] {
  return difficulty === "all" ? [...items] : items.filter((i) => i.level === difficulty);
}

export function levelCounts(items: readonly TopicItem[]): Record<Difficulty, number> {
  const counts = { all: items.length, easy: 0, medium: 0, hard: 0 };
  for (const i of items) counts[i.level]++;
  return counts;
}

export type Chunk = { from: number; to: number; answered: number; right: number; size: number };

/** Splits a list into ranges of `size` (#1–20, #21–40, ...), with the student's progress in each. */
export function chunks(items: readonly TopicItem[], size: number): Chunk[] {
  const out: Chunk[] = [];
  if (size < 1) return out;
  for (let start = 0; start < items.length; start += size) {
    const part = items.slice(start, start + size);
    out.push({
      from: start + 1,
      to: start + part.length,
      size: part.length,
      answered: part.filter((i) => i.result !== null).length,
      right: part.filter((i) => i.result === "correct").length,
    });
  }
  return out;
}

/** Where to start by default: the first range the student hasn't finished (or the first one). */
export function suggestedStart(items: readonly TopicItem[], size: number): number {
  const list = chunks(items, size);
  return (list.find((c) => c.answered < c.size) ?? list[0])?.from ?? 1;
}

/** Plain words for a range's progress. */
export function chunkStatus(c: Chunk): string {
  if (c.answered === 0) return "Not started";
  if (c.answered < c.size) return `${c.answered} of ${c.size} done`;
  return `Done, ${c.right} right`;
}
