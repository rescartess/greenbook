import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000e1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000e2";
const S2 = "bbbbbbbb-0000-4000-8000-0000000000e3";
let t: Awaited<ReturnType<typeof freshDatabase>>;
let setId: string;

type State = { status: string; module: { attemptModuleId: string; deadlineAt: string; serverNow: string }; questions: { id: string }[] };

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.addUser(S2);
  await t.actAs(ADMIN);
  setId = (await t.one<{ id: string }>(`select public.admin_create_test('Pause test', 'english', 32) id`)).id;
  const m1 = (await t.one<{ id: string }>(`select id from public.modules where set_id = $1 and module_number = 1`, [setId])).id;
  const item = { prompt: "Q", choices: [{ id: "A", text: "a" }, { id: "B", text: "b" }], answer: "A", difficulty: "easy" };
  await t.db.query(`select public.admin_add_questions($1, $2)`, [m1, JSON.stringify([item, item])]);
  await t.db.query(`update public.question_sets set published = true where id = $1`, [setId]);
});

const state = async (a: string) => (await t.one<{ s: State }>(`select public.get_test_state($1) s`, [a])).s;

describe("save and exit", () => {
  it("stops the clock, refuses answers while paused, and restarts with the time left", async () => {
    await t.actAs(S1);
    const attempt = (await t.one<{ id: string }>(`select public.start_full_test($1) id`, [setId])).id;
    const s = await state(attempt);
    const am = s.module.attemptModuleId;

    // Pretend 10 minutes have passed: 22 minutes left.
    await t.actAsOwner();
    await t.db.query(`update public.attempt_modules set deadline_at = now() + interval '22 minutes' where id = $1`, [am]);
    await t.actAs(S1);
    await t.db.query(`select public.pause_test($1)`, [am]);

    await t.actAsOwner();
    const paused = await t.one<{ deadline_at: string | null; paused_remaining_sec: number }>(
      `select deadline_at, paused_remaining_sec from public.attempt_modules where id = $1`,
      [am],
    );
    expect(paused.deadline_at).toBeNull();
    expect(paused.paused_remaining_sec).toBeGreaterThan(22 * 60 - 3);

    await t.actAs(S1);
    await expect(t.db.query(`select public.save_response($1, $2, 'A', false, '{}', 0)`, [am, s.questions[0].id])).rejects.toThrow(/paused/);

    const back = await state(attempt);
    const left = new Date(back.module.deadlineAt).getTime() - new Date(back.module.serverNow).getTime();
    expect(left).toBeGreaterThan(22 * 60 * 1000 - 5000);
    expect(left).toBeLessThanOrEqual(22 * 60 * 1000 + 1000);
    await t.db.query(`select public.save_response($1, $2, 'A', false, '{}', 0)`, [am, s.questions[0].id]);
  });

  it("only the owner's visit restarts the clock", async () => {
    await t.actAs(S2);
    const attempt = (await t.one<{ id: string }>(`select public.start_full_test($1) id`, [setId])).id;
    const am = (await state(attempt)).module.attemptModuleId;
    await t.db.query(`select public.pause_test($1)`, [am]);
    await t.actAs(ADMIN);
    await state(attempt);
    await t.actAsOwner();
    expect((await t.one<{ p: number | null }>(`select paused_remaining_sec p from public.attempt_modules where id = $1`, [am])).p).not.toBeNull();
  });
});

describe("delete and exit", () => {
  it("abandons the attempt so a new one starts fresh, and only for its owner", async () => {
    await t.actAs(S1);
    const attempt = (await t.one<{ id: string }>(`select public.start_full_test($1) id`, [setId])).id;
    await t.actAs(S2);
    await expect(t.db.query(`select public.abandon_test($1)`, [attempt])).rejects.toThrow(/isn’t yours/);
    await t.actAs(S1);
    await t.db.query(`select public.abandon_test($1)`, [attempt]);
    expect((await state(attempt)).status).toBe("abandoned");
    const fresh = (await t.one<{ id: string }>(`select public.start_full_test($1) id`, [setId])).id;
    expect(fresh).not.toBe(attempt);
    expect((await t.one<{ n: number }>(`select count(*)::int n from public.question_progress`)).n).toBe(0);
  });
});
