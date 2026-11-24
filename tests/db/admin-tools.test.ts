import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000c1";
const STUDENT = "bbbbbbbb-0000-4000-8000-0000000000c2";
let t: Awaited<ReturnType<typeof freshDatabase>>;
let setId: string;
let moduleId: string;

const item = (n: number) => ({
  prompt: `Question ${n}`,
  choices: [
    { id: "A", text: "a" },
    { id: "B", text: "b" },
  ],
  answer: "B",
  explanation: `Because ${n}`,
  difficulty: "easy",
});

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(STUDENT);
});

const positions = async () =>
  (
    await t.db.query<{ prompt: string; position: number }>(
      `select q.prompt, mq.position from public.module_questions mq join public.questions q on q.id = mq.question_id where mq.module_id = $1 order by mq.position`,
      [moduleId],
    )
  ).rows.map((r) => `${r.position}:${r.prompt}`);

describe("admin tools", () => {
  it("creates a test with module 1 and both module 2 versions", async () => {
    await t.actAs(ADMIN);
    setId = (await t.one<{ id: string }>(`select public.admin_create_test('Practice test 2', 'english', 32) id`)).id;
    const modules = await t.db.query<{ module_number: number; tier: string; time_limit_sec: number }>(
      `select module_number, tier, time_limit_sec from public.modules where set_id = $1 order by sort_order`,
      [setId],
    );
    expect(modules.rows).toEqual([
      { module_number: 1, tier: "standard", time_limit_sec: 1920 },
      { module_number: 2, tier: "easier", time_limit_sec: 1920 },
      { module_number: 2, tier: "harder", time_limit_sec: 1920 },
    ]);
    moduleId = (await t.one<{ id: string }>(`select id from public.modules where set_id = $1 and module_number = 1`, [setId])).id;
  });

  it("adds questions with answers to the end of a module, as drafts", async () => {
    const ids = (await t.one<{ ids: string[] }>(`select public.admin_add_questions($1, $2) ids`, [moduleId, JSON.stringify([item(1), item(2), item(3)])])).ids;
    expect(ids).toHaveLength(3);
    expect(ids[0]).toMatch(/^eng-\d{6}-[0-9a-f]{6}$/);
    expect(await positions()).toEqual(["1:Question 1", "2:Question 2", "3:Question 3"]);
    const q = await t.one<{ status: string; correct_answer: string; explanation: string }>(
      `select q.status, a.correct_answer, a.explanation from public.questions q join public.question_answers a on a.question_id = q.id where q.external_id = $1`,
      [ids[1]],
    );
    expect(q).toEqual({ status: "draft", correct_answer: "B", explanation: "Because 2" });
  });

  it("moves a question up and down", async () => {
    const third = (await t.one<{ id: string }>(`select id from public.questions where prompt = 'Question 3'`)).id;
    await t.db.query(`select public.admin_move_in_module($1, $2, -1)`, [moduleId, third]);
    expect(await positions()).toEqual(["1:Question 1", "2:Question 3", "3:Question 2"]);
    await t.db.query(`select public.admin_move_in_module($1, $2, -1)`, [moduleId, third]);
    await t.db.query(`select public.admin_move_in_module($1, $2, -1)`, [moduleId, third]);
    expect(await positions()).toEqual(["1:Question 3", "2:Question 1", "3:Question 2"]);
  });

  it("removes a question from a module and closes the gap, keeping the question", async () => {
    const first = (await t.one<{ id: string }>(`select id from public.questions where prompt = 'Question 1'`)).id;
    await t.db.query(`select public.admin_remove_from_module($1, $2)`, [moduleId, first]);
    expect(await positions()).toEqual(["1:Question 3", "2:Question 2"]);
    expect((await t.one<{ n: number }>(`select count(*)::int n from public.questions where id = $1`, [first])).n).toBe(1);
  });

  it("is all-or-nothing: one bad question adds none", async () => {
    const bad = { ...item(9), difficulty: "brutal" };
    await expect(t.db.query(`select public.admin_add_questions($1, $2)`, [moduleId, JSON.stringify([item(8), bad])])).rejects.toThrow();
    expect(await positions()).toEqual(["1:Question 3", "2:Question 2"]);
  });

  it("refuses students", async () => {
    await t.actAs(STUDENT);
    await expect(t.db.query(`select public.admin_create_test('Mine', 'english', 32)`)).rejects.toThrow(/policy|permission/);
    await expect(t.db.query(`select public.admin_add_questions($1, $2)`, [moduleId, JSON.stringify([item(5)])])).rejects.toThrow();
  });
});
