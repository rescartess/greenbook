import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000d1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000d2";
let t: Awaited<ReturnType<typeof freshDatabase>>;

type Topic = { id: string; title: string; hard: number };
const list = async (collection: string) =>
  (await t.one<{ t: Topic[] }>(`select public.list_topics('math', $1) t`, [collection])).t;
const topicId = async (title: string, collection: string) =>
  (await t.one<{ id: string }>(
    `select id from public.question_sets where subject = 'math' and title = $1 and collection = $2`,
    [title, collection],
  )).id;

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
});

describe("Math topics", () => {
  it("has the 19 College Board skills in both collections, hidden from students", async () => {
    await t.actAs(ADMIN);
    for (const collection of ["books", "sqb"]) {
      const topics = await list(collection);
      expect(topics).toHaveLength(19);
      expect(topics[0].title).toBe("Linear Equations in One Variable");
      expect(topics[18].title).toBe("Circles");
    }
    await t.actAsOwner();
    const noSkill = await t.one<{ n: number }>(
      `select count(*)::int n from public.question_sets where subject = 'math' and kind = 'topic' and skill_id is null`,
    );
    expect(noSkill.n).toBe(0);
    await t.actAs(S1);
    expect(await list("books")).toHaveLength(0);
  });

  it("imports typed-answer questions with the other forms that count", async () => {
    await t.actAs(ADMIN);
    const id = await topicId("Linear Functions", "books");
    const items = [
      { source: "MathBook 3.0 · Linear Functions · 13", skill: "math-linear-functions", difficulty: "medium", type: "spr",
        passage: null, prompt: "What is the slope \\(m\\)?", choices: [], answer: "24/5", accepted: ["4.8"], image: null },
      { source: "MathBook 3.0 · Linear Functions · 1", skill: "math-linear-functions", difficulty: "easy",
        passage: null, prompt: "Which?", choices: [{ id: "A", text: "1" }, { id: "B", text: "2" }], answer: "B", image: null },
    ];
    expect((await t.one<{ n: number }>(`select public.admin_import_questions($1, $2) n`, [id, JSON.stringify(items)])).n).toBe(2);
    await t.actAsOwner();
    const row = await t.one<{ type: string; accepted: string[]; ok: boolean; ok2: boolean; no: boolean }>(
      `select q.type, a.accepted_answers accepted,
              private.answer_matches('4.8', a.correct_answer, a.accepted_answers) ok,
              private.answer_matches('24/5', a.correct_answer, a.accepted_answers) ok2,
              private.answer_matches('4.7', a.correct_answer, a.accepted_answers) no
       from public.questions q join public.question_answers a on a.question_id = q.id
       where q.source = 'MathBook 3.0 · Linear Functions · 13'`,
    );
    expect(row).toMatchObject({ type: "spr", accepted: ["4.8"], ok: true, ok2: true, no: false });
    const mcq = await t.one<{ type: string }>(`select type from public.questions where source = 'MathBook 3.0 · Linear Functions · 1'`);
    expect(mcq.type).toBe("mcq");
  });

  it("refuses typed answers outside Math and broken items", async () => {
    await t.actAs(ADMIN);
    const english = (await t.one<{ id: string }>(
      `select id from public.question_sets where subject = 'english' and title = 'Boundaries' and collection = 'books'`,
    )).id;
    const spr = { source: "X1", skill: null, difficulty: "easy", type: "spr", prompt: "Q", choices: [], answer: "3" };
    await expect(t.one(`select public.admin_import_questions($1, $2)`, [english, JSON.stringify([spr])])).rejects.toThrow(/incomplete/);
    const math = await topicId("Circles", "books");
    await expect(
      t.one(`select public.admin_import_questions($1, $2)`, [math, JSON.stringify([{ ...spr, choices: [{ id: "A", text: "1" }] }])]),
    ).rejects.toThrow(/incomplete/);
    await t.actAs(S1);
    await expect(t.one(`select public.admin_import_questions($1, $2)`, [math, JSON.stringify([spr])])).rejects.toThrow(/Only the admin/);
  });
});
