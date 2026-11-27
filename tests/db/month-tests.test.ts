import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000e1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000e2";
let t: Awaited<ReturnType<typeof freshDatabase>>;

type State = { status: string; module: { attemptModuleId: string; number: number }; questions: { id: string; prompt: string }[] };

const item = (source: string, difficulty: string, answer = "B") => ({
  source, skill: "english-words-in-context", difficulty, passage: "A text with a ______.", prompt: source,
  choices: ["A", "B", "C", "D"].map((id) => ({ id, text: id.toLowerCase() })), answer, image: null,
});
const levels = ["easy", "easy", "medium", "hard", "hard"];
const fixed = {
  title: "2025 September A", subject: "english", month: "2025-09-01", adaptive: false,
  modules: [
    { number: 1, tier: "standard", items: levels.map((d, i) => item(`Sep A · M1 · ${i + 1}`, d)) },
    { number: 2, tier: "harder", items: levels.map((d, i) => item(`Sep A · M2 hard · ${i + 1}`, d)) },
  ],
};
const adaptive = {
  title: "2025 September adaptive", subject: "english", month: "2025-09-01", adaptive: true,
  modules: [
    { number: 1, tier: "standard", items: fixed.modules[0].items },
    { number: 2, tier: "harder", items: fixed.modules[1].items },
    { number: 2, tier: "easier", items: levels.map((d, i) => item(`Sep · M2 easy · ${i + 1}`, d)) },
  ],
};

const importTest = async (test: unknown) =>
  (await t.one<{ r: Record<string, unknown> }>(`select public.admin_import_test($1) r`, [JSON.stringify(test)])).r;
const start = async (set: string) => (await t.one<{ id: string }>(`select public.start_full_test($1) id`, [set])).id;
const state = async (attempt: string) => (await t.one<{ s: State }>(`select public.get_test_state($1) s`, [attempt])).s;
const save = (am: string, q: string, answer: string) =>
  t.db.query(`select public.save_response($1, $2, $3, false, '{}', 0)`, [am, q, answer]);
const finish = async (am: string) => (await t.one<{ s: string }>(`select public.finish_module($1) s`, [am])).s;

/** Takes the test, answering wrong only the questions whose prompt is in `wrong`. */
async function take(setId: string, wrong: string[] = []) {
  await t.actAs(S1);
  const attempt = await start(setId);
  for (let n = 0; n < 2; n++) {
    const s = await state(attempt);
    for (const q of s.questions) await save(s.module.attemptModuleId, q.id, wrong.includes(q.prompt) ? "A" : "B");
    await finish(s.module.attemptModuleId);
  }
  await t.actAsOwner();
  const a = await t.one<{ score: number; theta: number }>(
    `select scaled_score score, private.estimate_theta(id)::float theta from public.attempts where id = $1`, [attempt]);
  await t.db.query(`update public.attempts set status = 'abandoned' where id = $1`, [attempt]);
  return a;
}

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
});

describe("importing month full tests", () => {
  it("only lets the admin import", async () => {
    await t.actAs(S1);
    await expect(importTest(fixed)).rejects.toThrow(/Only the admin/);
  });

  it("adds a fixed test as a draft, and skips it the second time", async () => {
    await t.actAs(ADMIN);
    expect(await importTest(fixed)).toMatchObject({ added: 10, reused: 0 });
    expect(await importTest(fixed)).toEqual({ skipped: true });
    await t.actAsOwner();
    const set = await t.one<{ published: boolean; is_adaptive: boolean; modules: number; month: string }>(
      `select published, is_adaptive, month::text, (select count(*)::int from public.modules m where m.set_id = s.id) modules
       from public.question_sets s where title = '2025 September A'`);
    expect(set).toEqual({ published: false, is_adaptive: false, modules: 2, month: "2025-09-01" });
  });

  it("reuses questions already in the database for the adaptive test", async () => {
    await t.actAs(ADMIN);
    expect(await importTest(adaptive)).toMatchObject({ added: 5, reused: 10 });
    await t.actAsOwner();
    expect((await t.one<{ n: number }>(`select count(*)::int n from public.questions`)).n).toBe(15);
  });

  it("refuses a question whose answer isn’t one of its choices", async () => {
    await t.actAs(ADMIN);
    const bad = { ...fixed, title: "Broken", modules: [{ number: 1, items: [item("Broken · 1", "easy", "E")] }, fixed.modules[1]] };
    await expect(importTest(bad)).rejects.toThrow(/incomplete/);
  });
});

describe("score estimate", () => {
  let setId: string;
  beforeAll(async () => {
    await t.actAsOwner();
    setId = (await t.one<{ id: string }>(`select id from public.question_sets where title = '2025 September A'`)).id;
    await t.db.query(`update public.question_sets set published = true where id = $1`, [setId]);
    await t.db.query(`update public.questions set status = 'published'`);
  });

  it("gives 800 only for a perfect hard route", async () => {
    expect((await take(setId)).score).toBe(800);
    expect((await take(setId, ["Sep A · M2 hard · 5"])).score).toBeLessThan(800);
  });

  it("costs more for a missed easy question than a missed hard one", async () => {
    const easyMiss = await take(setId, ["Sep A · M1 · 1"]);
    const hardMiss = await take(setId, ["Sep A · M1 · 5"]);
    expect(easyMiss.theta).toBeLessThan(hardMiss.theta);
  });

  it("goes up with every extra right answer", async () => {
    const all = fixed.modules.flatMap((m) => m.items.map((i) => i.source));
    const thetas: number[] = [];
    for (let wrong = all.length; wrong >= 0; wrong -= 2) thetas.push((await take(setId, all.slice(0, wrong))).theta);
    thetas.slice(1).forEach((theta, i) => expect(theta).toBeGreaterThan(thetas[i]));
  });
});
