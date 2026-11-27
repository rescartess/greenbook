/**
 * The import file Claude prepares from a question book (format "greenbook-import-1"):
 * {
 *   format, book, subject, collection ("books" or "sqb", default "books"),
 *   topics: [{ topic: "<topic title>", items: [{ source, skill, difficulty, type?, passage, prompt, choices, answer, accepted?, explanation?, image }] }],
 *   tests: [{ title, month ("2025-09-01"), adaptive, modules: [{ number: 1 | 2, tier, items: [...] }] }],
 *   images: { "<storage path>": "<base64 picture>" }
 * }
 * A file has topics, tests, or both. Tests become drafts; an item whose source is already in the
 * database is reused (so a month's adaptive test can share modules with its fixed tests).
 * Questions go to the end of the named topic, in order; questions already imported (same source) are skipped.
 * type is "mcq" (default: choices, answer = a choice id) or "spr" (Math typed answer: no choices,
 * answer = the book's answer, accepted = other forms that also count, e.g. "4.8" for "24/5").
 */

export type ImportItem = {
  source: string;
  skill: string | null;
  difficulty: "easy" | "medium" | "hard";
  type: "mcq" | "spr";
  passage: string | null;
  prompt: string;
  choices: { id: string; text: string }[];
  answer: string;
  accepted: string[];
  explanation: string | null;
  image: string | null;
};

export type ImportModule = { number: 1 | 2; tier: "standard" | "easier" | "harder"; items: ImportItem[] };

export type ImportTest = { title: string; month: string | null; adaptive: boolean; modules: ImportModule[] };

export type ImportBook = {
  book: string;
  subject: string;
  collection: "books" | "sqb";
  topics: { topic: string; items: ImportItem[] }[];
  tests: ImportTest[];
  images: Record<string, string>;
};

const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : null);

/** Reads and checks an import file. Throws a plain-language error if anything is off. */
export function parseImportBook(text: string): ImportBook {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This isn’t an import file. Choose the .json files whose names start with “GreenBook import”, not the book PDFs.");
  }
  const root = obj(raw);
  if (!root || root.format !== "greenbook-import-1") throw new Error("This isn’t a FreedomPrep import file.");
  const topics = Array.isArray(root.topics) ? root.topics : [];
  const tests = Array.isArray(root.tests) ? root.tests : [];
  if (topics.length === 0 && tests.length === 0) throw new Error("The file has no questions.");
  const images = (obj(root.images) ?? {}) as Record<string, unknown>;

  const readItems = (list: unknown, title: string) =>
    (Array.isArray(list) ? list : []).map((rawItem, i) => {
      const it = obj(rawItem) ?? {};
      const where = `${title}, question ${i + 1}`;
      const choices = Array.isArray(it.choices) ? (it.choices as { id: string; text: string }[]) : [];
      if (typeof it.source !== "string" || !it.source) throw new Error(`${where} has no source.`);
      if (typeof it.prompt !== "string" || !it.prompt) throw new Error(`${where} has no question text.`);
      const type = it.type === "spr" ? "spr" : "mcq";
      const accepted = Array.isArray(it.accepted) ? it.accepted.filter((a): a is string => typeof a === "string") : [];
      if (type === "spr") {
        if (choices.length > 0) throw new Error(`${where} is a typed answer but has answer choices.`);
        if (typeof it.answer !== "string" || !it.answer.trim()) throw new Error(`${where} has no correct answer.`);
      } else {
        if (choices.length < 2 || choices.some((c) => typeof c?.id !== "string" || typeof c?.text !== "string"))
          throw new Error(`${where} has broken answer choices.`);
        if (typeof it.answer !== "string" || !choices.some((c) => c.id === it.answer))
          throw new Error(`${where} has no correct answer among its choices.`);
      }
      if (it.difficulty !== "easy" && it.difficulty !== "medium" && it.difficulty !== "hard")
        throw new Error(`${where} has no level.`);
      const image = typeof it.image === "string" && it.image ? it.image : null;
      if (image && typeof images[image] !== "string") throw new Error(`${where} needs a picture that isn’t in the file.`);
      return {
        source: it.source,
        skill: typeof it.skill === "string" ? it.skill : null,
        difficulty: it.difficulty,
        type,
        passage: typeof it.passage === "string" && it.passage ? it.passage : null,
        prompt: it.prompt,
        choices,
        answer: it.answer,
        accepted,
        explanation: typeof it.explanation === "string" && it.explanation ? it.explanation : null,
        image,
      } satisfies ImportItem;
    });

  const parsed = topics.map((t, ti) => {
    const topic = obj(t);
    const title = typeof topic?.topic === "string" ? topic.topic : "";
    if (!title) throw new Error(`Part ${ti + 1} of the file has no topic name.`);
    return { topic: title, items: readItems(topic?.items, title) };
  });

  const parsedTests = tests.map((raw, ti) => {
    const test = obj(raw);
    const title = typeof test?.title === "string" ? test.title.trim() : "";
    if (!title) throw new Error(`Test ${ti + 1} in the file has no title.`);
    const modules = (Array.isArray(test?.modules) ? test.modules : []).map((rawModule) => {
      const m = obj(rawModule) ?? {};
      const number = m.number === 2 ? 2 : 1;
      const tier = m.tier === "easier" || m.tier === "harder" ? m.tier : "standard";
      const label = `${title}, Module ${number}${number === 2 ? ` (${tier})` : ""}`;
      const items = readItems(m.items, label);
      if (items.length === 0) throw new Error(`${label} has no questions.`);
      return { number, tier, items } satisfies ImportModule;
    });
    if (modules.filter((m) => m.number === 1).length !== 1 || modules.filter((m) => m.number === 2).length < 1)
      throw new Error(`${title} needs one Module 1 and at least one Module 2.`);
    return {
      title,
      month: typeof test?.month === "string" && /^\d{4}-\d{2}-01$/.test(test.month) ? test.month : null,
      adaptive: test?.adaptive === true,
      modules,
    } satisfies ImportTest;
  });

  return {
    book: typeof root.book === "string" ? root.book : "Untitled book",
    subject: root.subject === "math" ? "math" : "english",
    collection: root.collection === "sqb" ? "sqb" : "books",
    topics: parsed,
    tests: parsedTests,
    images: Object.fromEntries(Object.entries(images).filter((e): e is [string, string] => typeof e[1] === "string")),
  };
}

/** Splits a list into batches (the database takes up to 300 questions per call). */
export function batches<T>(list: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** "image/webp" for "x.webp", and so on. */
export function imageType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  return ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/webp";
}
