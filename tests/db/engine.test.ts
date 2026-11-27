import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

type Db = Awaited<ReturnType<typeof freshDatabase>>;
type State = {
  status: string;
  module: { attemptModuleId: string; number: number; deadlineAt: string; serverNow: string; isLast: boolean };
  questions: { id: string; prompt: string }[];
  responses: { questionId: string; answer: string | null; marked: boolean }[];
};
type Results = {
  rawCorrect: number;
  scaledScore: number;
  modules: { questions: { answer: string | null; isCorrect: boolean; explanation: string | null }[] }[];
};

const ADMIN = "aaaaaaaa-0000-4000-8000-000000000001";
const S1 = "bbbbbbbb-0000-4000-8000-000000000001";
const S2 = "bbbbbbbb-0000-4000-8000-000000000002";

let t: Db;
let setId: string;
let draftId: string;

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.addUser(S2);
  await t.db.exec(`
    do $$
    declare s uuid; m1 uuid; me uuid; mh uuid; q uuid; i int;
    begin
      insert into public.question_sets (kind, title, subject, is_adaptive, published) values ('full_test','Mini test','english',true,true) returning id into s;
      insert into public.modules (set_id, module_number, tier, time_limit_sec, sort_order) values (s,1,'standard',60,1) returning id into m1;
      insert into public.modules (set_id, module_number, tier, time_limit_sec, sort_order) values (s,2,'easier',60,2) returning id into me;
      insert into public.modules (set_id, module_number, tier, time_limit_sec, sort_order) values (s,2,'harder',60,3) returning id into mh;
      for i in 1..5 loop
        insert into public.questions (external_id, subject, difficulty, type, prompt, choices, status)
          values ('m1-'||i,'english','medium','mcq','Q'||i, '[{"id":"A","text":"a"},{"id":"B","text":"b"}]', 'published') returning id into q;
        insert into public.question_answers (question_id, correct_answer, explanation) values (q, 'B', 'secret-expl-'||i);
        insert into public.module_questions values (m1, q, i);
      end loop;
      for i in 1..3 loop
        insert into public.questions (external_id, subject, difficulty, type, prompt, status) values ('easy-'||i,'english','easy','mcq','E'||i,'published') returning id into q;
        insert into public.question_answers (question_id, correct_answer) values (q, 'A');
        insert into public.module_questions values (me, q, i);
        insert into public.questions (external_id, subject, difficulty, type, prompt, status) values ('hard-'||i,'english','hard','spr','H'||i,'published') returning id into q;
        insert into public.question_answers (question_id, correct_answer, accepted_answers) values (q, '3/4', '{".75"}');
        insert into public.module_questions values (mh, q, i);
      end loop;
      insert into public.question_sets (kind, title, subject, is_adaptive, published) values ('full_test','Hidden draft','english',true,false);
    end $$;`);
  setId = (await t.one<{ id: string }>(`select id from public.question_sets where title = 'Mini test'`)).id;
  draftId = (await t.one<{ id: string }>(`select id from public.question_sets where title = 'Hidden draft'`)).id;
});

const start = async (set: string) => (await t.one<{ id: string }>(`select public.start_full_test($1) id`, [set])).id;
const state = async (attempt: string) => (await t.one<{ s: State }>(`select public.get_test_state($1) s`, [attempt])).s;
const save = (am: string, q: string, answer: string | null, marked = false, eliminated: string[] = [], seconds = 0) =>
  t.db.query(`select public.save_response($1, $2, $3, $4, $5, $6)`, [am, q, answer, marked, eliminated, seconds]);
const finish = async (am: string) => (await t.one<{ s: string }>(`select public.finish_module($1) s`, [am])).s;

describe("answer matching", () => {
  it.each([
    [" b ", "B", true],
    ["0.75", "3/4", true],
    ["", "A", false],
    ["1/0", "1", false],
  ])("%j against %j -> %s", async (given, correct, expected) => {
    await t.actAsOwner();
    const row = await t.one<{ v: boolean }>(`select private.answer_matches($1, $2, '{}') v`, [given, correct]);
    expect(row.v).toBe(expected);
  });
});

describe("a full adaptive test", () => {
  let attempt: string;
  let first: State;

  it("starts a published test and resumes it instead of starting twice", async () => {
    await t.actAs(S1);
    attempt = await start(setId);
    expect(await start(setId)).toBe(attempt);
    await expect(t.db.query(`select public.start_full_test($1)`, [draftId])).rejects.toThrow(/isn’t available/);
  });

  it("sends questions in order, with a server deadline, and no answers", async () => {
    first = await state(attempt);
    expect(first.module.number).toBe(1);
    expect(first.questions).toHaveLength(5);
    expect(new Date(first.module.deadlineAt).getTime() - new Date(first.module.serverNow).getTime()).toBeCloseTo(60000, -4);
    const text = JSON.stringify(first);
    expect(text).not.toContain("secret-expl");
    expect(text).not.toMatch(/correct_?answer/i);
    expect((await t.one<{ n: number }>(`select count(*)::int n from public.question_answers`)).n).toBe(0);
  });

  it("saves answers, marks and changes", async () => {
    const am = first.module.attemptModuleId;
    for (const [i, q] of first.questions.entries()) await save(am, q.id, i < 4 ? "B" : "A", i === 2, i === 0 ? ["A"] : [], 20);
    await save(am, first.questions[0].id, "B");
    const now = await state(attempt);
    expect(now.responses.find((r) => r.questionId === first.questions[0].id)?.marked).toBe(false);
    expect(now.responses.find((r) => r.questionId === first.questions[2].id)?.marked).toBe(true);
  });

  it("blocks writing outside the rules", async () => {
    const am = first.module.attemptModuleId;
    await t.actAsOwner();
    const other = (await t.one<{ id: string }>(`select id from public.questions where external_id = 'easy-1'`)).id;
    await t.actAs(S1);
    await expect(save(am, other, "A")).rejects.toThrow(/isn’t in this module/);
    await t.actAs(S2);
    await expect(save(am, first.questions[1].id, "B")).rejects.toThrow(/isn’t yours/);
    await expect(state(attempt)).rejects.toThrow(/isn’t yours/);
    await expect(
      t.db.query(`insert into public.responses (attempt_module_id, question_id, answer) values ($1, $2, 'B')`, [am, first.questions[1].id]),
    ).rejects.toThrow(/policy|permission/i);
  });

  it("routes 4 of 5 right to the harder module 2 and locks module 1", async () => {
    await t.actAs(S1);
    expect(await finish(first.module.attemptModuleId)).toBe("in_progress");
    await expect(save(first.module.attemptModuleId, first.questions[1].id, "B")).rejects.toThrow(/already finished/);
    const second = await state(attempt);
    expect(second.module.number).toBe(2);
    expect(second.module.isLast).toBe(true);
    expect(second.questions[0].prompt).toMatch(/^H/);
    await save(second.module.attemptModuleId, second.questions[0].id, ".75");
    await save(second.module.attemptModuleId, second.questions[1].id, "3/4");

    await t.actAsOwner();
    await t.db.query(`update public.attempt_modules set deadline_at = now() - interval '1 minute' where id = $1`, [second.module.attemptModuleId]);
    await t.actAs(S1);
    await expect(save(second.module.attemptModuleId, second.questions[2].id, "1")).rejects.toThrow(/Time is up/);
    expect((await state(attempt)).status).toBe("completed");
  });

  it("scores both modules and reveals explanations only afterwards", async () => {
    const r = (await t.one<{ r: Results }>(`select public.get_test_results($1) r`, [attempt])).r;
    expect(r.rawCorrect).toBe(6);
    await t.actAsOwner();
    const expected = await t.one<{ s: number }>(`select private.estimate_score($1) s`, [attempt]);
    expect(r.scaledScore).toBe(expected.s);
    expect(r.scaledScore).toBeGreaterThanOrEqual(200);
    expect(r.scaledScore).toBeLessThan(800);
    expect(r.modules[0].questions[0].explanation).toBe("secret-expl-1");
    expect(r.modules[1].questions[2]).toMatchObject({ answer: null, isCorrect: false });
    expect(r.modules[0].questions.map((q) => (q as unknown as { marked: boolean }).marked)).toEqual([false, false, true, false, false]);
    await t.actAs(S1);
    const progress = await t.one<{ n: number; wrong: number }>(`select count(*)::int n, sum(times_wrong)::int wrong from public.question_progress`);
    expect(progress).toEqual({ n: 8, wrong: 2 });
  });

  it("routes a weak module 1 to the easier module 2", async () => {
    await t.actAs(S2);
    const a = await start(setId);
    let s = await state(a);
    await save(s.module.attemptModuleId, s.questions[0].id, "B");
    await finish(s.module.attemptModuleId);
    s = await state(a);
    expect(s.questions[0].prompt).toMatch(/^E/);
    await finish(s.module.attemptModuleId);
    const r = (await t.one<{ r: Results }>(`select public.get_test_results($1) r`, [a])).r;
    expect(r.rawCorrect).toBe(1);
    expect((await t.one<{ n: number }>(`select count(*)::int n from public.attempts`)).n).toBe(1);
  });

  it("lets a student delete their own finished attempt, and nobody else's", async () => {
    await t.actAs(S2);
    await expect(t.db.query(`select public.remove_attempt($1)`, [attempt])).rejects.toThrow(/isn’t yours/);
    const mine = (await t.one<{ id: string }>(`select id from public.attempts where status = 'completed'`)).id;
    await t.db.query(`select public.remove_attempt($1)`, [mine]);
    expect((await t.one<{ status: string }>(`select status from public.attempts where id = $1`, [mine])).status).toBe("abandoned");
    await expect(t.db.query(`select public.remove_attempt($1)`, [mine])).rejects.toThrow(/already removed/);
  });
});

describe("estimated score tables", () => {
  it("never go down as more answers are right, and only the harder route reaches 800", async () => {
    await t.actAsOwner();
    const mono = await t.one<{ ok: boolean }>(
      `select bool_and(s >= prev) ok from (select scaled_score s, lag(scaled_score, 1, 200) over (partition by subject, tier order by raw_correct) prev from public.score_tables) x`,
    );
    expect(mono.ok).toBe(true);
    const tops = await t.db.query<{ subject: string; tier: string; m: number }>(
      `select subject, tier, max(scaled_score) m from public.score_tables group by 1, 2 order by 1, 2`,
    );
    expect(tops.rows.filter((r) => r.tier === "harder").every((r) => r.m === 800)).toBe(true);
    expect(tops.rows.filter((r) => r.tier === "easier").every((r) => r.m < 700)).toBe(true);
  });
});
