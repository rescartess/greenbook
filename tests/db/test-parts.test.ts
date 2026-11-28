import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000f1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000f2";
let t: Awaited<ReturnType<typeof freshDatabase>>;

type State = { status: string; part: string; module: { attemptModuleId: string; number: number; isLast: boolean }; questions: { id: string; prompt: string }[] };

const item = (source: string) => ({
  source, skill: "english-words-in-context", difficulty: "medium", passage: "A text with a ______.", prompt: source,
  choices: ["A", "B", "C", "D"].map((id) => ({ id, text: id.toLowerCase() })), answer: "B", image: null,
});
const adaptive = {
  title: "2025 October adaptive", subject: "english", month: "2025-10-01", adaptive: true,
  modules: [
    { number: 1, tier: "standard", items: [1, 2, 3].map((i) => item(`Oct · M1 · ${i}`)) },
    { number: 2, tier: "harder", items: [1, 2, 3].map((i) => item(`Oct · M2 hard · ${i}`)) },
    { number: 2, tier: "easier", items: [1, 2, 3].map((i) => item(`Oct · M2 easy · ${i}`)) },
  ],
};

const start = async (set: string, part: string, tier: string | null = null) =>
  (await t.one<{ id: string }>(`select public.start_test_part($1, $2, $3) id`, [set, part, tier])).id;
const state = async (attempt: string) => (await t.one<{ s: State }>(`select public.get_test_state($1) s`, [attempt])).s;
const finish = async (am: string) => (await t.one<{ s: string }>(`select public.finish_module($1) s`, [am])).s;
const attempt = async (id: string) =>
  t.one<{ part: string; status: string; scaled_score: number | null; raw_correct: number; modules: number }>(
    `select part, status, scaled_score, raw_correct, (select count(*)::int from public.attempt_modules am where am.attempt_id = a.id) modules
     from public.attempts a where id = $1`, [id]);

let setId: string;
beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.actAs(ADMIN);
  await t.one(`select public.admin_import_test($1) r`, [JSON.stringify(adaptive)]);
  await t.actAsOwner();
  setId = (await t.one<{ id: string }>(`select id from public.question_sets where title = '2025 October adaptive'`)).id;
  await t.db.query(`update public.question_sets set published = true where id = $1`, [setId]);
  await t.db.query(`update public.questions set status = 'published'`);
});

describe("taking part of a full test", () => {
  it("Module 1 only ends after Module 1, counted by questions right, with no 200–800 score", async () => {
    await t.actAs(S1);
    const id = await start(setId, "module1");
    const s = await state(id);
    expect(s).toMatchObject({ part: "module1", module: { number: 1, isLast: true } });
    for (const q of s.questions) await t.db.query(`select public.save_response($1, $2, 'B', false, '{}', 0)`, [s.module.attemptModuleId, q.id]);
    expect(await finish(s.module.attemptModuleId)).toBe("completed");
    await t.actAsOwner();
    expect(await attempt(id)).toEqual({ part: "module1", status: "completed", scaled_score: null, raw_correct: 3, modules: 1 });
  });

  it("Module 2 only opens the hard Module 2 by default, or the easy one when asked", async () => {
    await t.actAs(S1);
    const hard = await start(setId, "module2");
    const h = await state(hard);
    expect(h.module).toMatchObject({ number: 2, isLast: true });
    expect(h.questions[0].prompt).toMatch(/M2 hard/);
    expect(await finish(h.module.attemptModuleId)).toBe("completed");

    const easy = await start(setId, "module2", "easier");
    const e = await state(easy);
    expect(e.questions[0].prompt).toMatch(/M2 easy/);
    await finish(e.module.attemptModuleId);
    await t.actAsOwner();
    expect(await attempt(easy)).toMatchObject({ part: "module2", status: "completed", scaled_score: null, modules: 1 });
  });

  it("the full test still runs both modules and gets a score", async () => {
    await t.actAs(S1);
    const id = await start(setId, "full");
    let s = await state(id);
    expect(s.module.isLast).toBe(false);
    await finish(s.module.attemptModuleId);
    s = await state(id);
    expect(s.module.number).toBe(2);
    await finish(s.module.attemptModuleId);
    await t.actAsOwner();
    const a = await attempt(id);
    expect(a).toMatchObject({ part: "full", status: "completed", modules: 2 });
    expect(a.scaled_score).toBeGreaterThanOrEqual(200);
  });

  it("continues a running attempt instead of starting another, and refuses unknown parts", async () => {
    await t.actAs(S1);
    const id = await start(setId, "module1");
    expect(await start(setId, "module2")).toBe(id);
    await expect(start(setId, "module3")).rejects.toThrow(/Pick the full test/);
    await t.actAsOwner();
    await t.db.query(`update public.attempts set status = 'abandoned' where id = $1`, [id]);
  });

  it("Results list says which part was taken", async () => {
    await t.actAs(S1);
    const list = (await t.one<{ l: { part: string }[] }>(`select public.list_my_attempts('english') l`)).l;
    expect(list.map((a) => a.part).sort()).toEqual(["full", "module1", "module2", "module2"]);
  });
});
