/**
 * The import file Claude prepares from a question book (format "greenbook-import-1"):
 * {
 *   format, book, subject,
 *   topics: [{ topic: "<topic title>", items: [{ source, skill, difficulty, passage, prompt, choices, answer, image }] }],
 *   images: { "<storage path>": "<base64 picture>" }
 * }
 * Questions go to the end of the named topic, in order; questions already imported (same source) are skipped.
 */

export type ImportItem = {
  source: string;
  skill: string | null;
  difficulty: "easy" | "medium" | "hard";
  passage: string | null;
  prompt: string;
  choices: { id: string; text: string }[];
  answer: string;
  image: string | null;
};

export type ImportBook = {
  book: string;
  subject: string;
  topics: { topic: string; items: ImportItem[] }[];
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
  if (!root || root.format !== "greenbook-import-1") throw new Error("This isn’t a GreenBook import file.");
  const topics = Array.isArray(root.topics) ? root.topics : [];
  if (topics.length === 0) throw new Error("The file has no questions.");
  const images = (obj(root.images) ?? {}) as Record<string, unknown>;

  const parsed = topics.map((t, ti) => {
    const topic = obj(t);
    const title = typeof topic?.topic === "string" ? topic.topic : "";
    if (!title) throw new Error(`Part ${ti + 1} of the file has no topic name.`);
    const items = (Array.isArray(topic?.items) ? topic.items : []).map((rawItem, i) => {
      const it = obj(rawItem) ?? {};
      const where = `${title}, question ${i + 1}`;
      const choices = Array.isArray(it.choices) ? (it.choices as { id: string; text: string }[]) : [];
      if (typeof it.source !== "string" || !it.source) throw new Error(`${where} has no source.`);
      if (typeof it.prompt !== "string" || !it.prompt) throw new Error(`${where} has no question text.`);
      if (choices.length < 2 || choices.some((c) => typeof c?.id !== "string" || typeof c?.text !== "string"))
        throw new Error(`${where} has broken answer choices.`);
      if (typeof it.answer !== "string" || !choices.some((c) => c.id === it.answer))
        throw new Error(`${where} has no correct answer among its choices.`);
      if (it.difficulty !== "easy" && it.difficulty !== "medium" && it.difficulty !== "hard")
        throw new Error(`${where} has no level.`);
      const image = typeof it.image === "string" && it.image ? it.image : null;
      if (image && typeof images[image] !== "string") throw new Error(`${where} needs a picture that isn’t in the file.`);
      return {
        source: it.source,
        skill: typeof it.skill === "string" ? it.skill : null,
        difficulty: it.difficulty,
        passage: typeof it.passage === "string" && it.passage ? it.passage : null,
        prompt: it.prompt,
        choices,
        answer: it.answer,
        image,
      } satisfies ImportItem;
    });
    return { topic: title, items };
  });

  return {
    book: typeof root.book === "string" ? root.book : "Untitled book",
    subject: root.subject === "math" ? "math" : "english",
    topics: parsed,
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
