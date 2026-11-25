import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000c1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000c2";
let t: Awaited<ReturnType<typeof freshDatabase>>;
let sqbBoundaries: string;

type Topic = { id: string; title: string; easy: number };
const list = async (collection?: string) =>
  (
    await t.one<{ t: Topic[] }>(
      collection ? `select public.list_topics('english', $1) t` : `select public.list_topics('english') t`,
      collection ? [collection] : [],
    )
  ).t;

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.actAsOwner();
  sqbBoundaries = (
    await t.one<{ id: string }>(`select id from public.question_sets where title = 'Boundaries' and collection = 'sqb'`)
  ).id;
});

describe("SQB collection", () => {
  it("has the same 10 topics, hidden from students until published", async () => {
    await t.actAs(ADMIN);
    const sqb = await list("sqb");
    expect(sqb).toHaveLength(10);
    expect(sqb[0].title).toBe("Boundaries");
    await t.actAs(S1);
    expect(await list("sqb")).toHaveLength(0);
  });

  it("keeps the old Topics list to the books collection", async () => {
    await t.actAs(ADMIN);
    const books = await list();
    expect(books.map((b) => b.id)).not.toContain(sqbBoundaries);
    expect(books).toEqual(await list("books"));
  });

  it("imports keep the explanation, and the setup page names the collection", async () => {
    await t.actAs(ADMIN);
    const item = {
      source: "SQB abc123",
      skill: "english-boundaries",
      difficulty: "easy",
      passage: "Passage",
      prompt: "Prompt",
      choices: [
        { id: "A", text: "a" },
        { id: "B", text: "b" },
      ],
      answer: "B",
      explanation: "Choice B is the best answer.",
      image: null,
    };
    expect((await t.one<{ n: number }>(`select public.admin_import_questions($1, $2) n`, [sqbBoundaries, JSON.stringify([item])])).n).toBe(1);
    await t.actAsOwner();
    const row = await t.one<{ explanation: string }>(
      `select a.explanation from public.question_answers a join public.questions q on q.id = a.question_id where q.source = 'SQB abc123'`,
    );
    expect(row.explanation).toBe("Choice B is the best answer.");
    await t.actAs(ADMIN);
    const topic = (await t.one<{ t: { collection: string; items: unknown[] } }>(`select public.get_topic($1) t`, [sqbBoundaries])).t;
    expect(topic.collection).toBe("sqb");
    expect(topic.items).toHaveLength(1);
  });
});
