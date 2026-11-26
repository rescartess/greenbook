import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000d1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000d2";
const S2 = "bbbbbbbb-0000-4000-8000-0000000000d3";
let t: Awaited<ReturnType<typeof freshDatabase>>;
let topicSet: string;
let fullSet: string;
let fullQuestion: string;

type Feedback = { isCorrect: boolean; correctAnswer: string; explanation: string | null; mastered?: boolean };
type PState = { attemptModuleId: string; status: string; questions: { id: string; feedback: Feedback | null }[] };

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.addUser(S2);
  await t.actAs(ADMIN);
  const skill = (await t.one<{ id: number }>(`select id from public.skills where slug = 'english-transitions'`)).id;
  topicSet = (await t.one<{ id: string }>(`select public.admin_create_set('topic', 'Transitions 1', 'english', $1, null) id`, [skill])).id;
  const mod = (await t.one<{ id: string }>(`select id from public.modules where set_id = $1`, [topicSet])).id;
  const items = [1, 2, 3].map((n) => ({
    prompt: `T${n}`,
    choices: [
      { id: "A", text: "a" },
      { id: "B", text: "b" },
    ],
    answer: "A",
    explanation: `Why ${n}`,
    skill_id: skill,
    difficulty: "easy",
  }));
  await t.db.query(`select public.admin_add_questions($1, $2)`, [mod, JSON.stringify(items)]);
  await t.db.query(`update public.questions set status = 'published'`);
  await t.db.query(`update public.question_sets set published = true where id = $1`, [topicSet]);

  // A published full test whose answers must stay secret from practice tools.
  fullSet = (await t.one<{ id: string }>(`select public.admin_create_test('Full', 'english', 32) id`)).id;
  const m1 = (await t.one<{ id: string }>(`select id from public.modules where set_id = $1 and module_number = 1`, [fullSet])).id;
  await t.db.query(`select public.admin_add_questions($1, $2)`, [m1, JSON.stringify([{ ...items[0], prompt: "F1", answer: "B" }])]);
  fullQuestion = (await t.one<{ id: string }>(`select id from public.questions where prompt = 'F1'`)).id;
  await t.db.query(`update public.questions set status = 'published'`);
  await t.db.query(`update public.question_sets set published = true where id = $1`, [fullSet]);
});

const pstate = async (attempt: string) => (await t.one<{ s: PState }>(`select public.get_practice_state($1) s`, [attempt])).s;
const check = async (am: string, q: string, a: string) =>
  (await t.one<{ f: Feedback }>(`select public.check_practice_answer($1, $2, $3) f`, [am, q, a])).f;

describe("topic practice", () => {
  let attempt: string;
  let state: PState;

  it("only practises topic and monthly sets", async () => {
    await t.actAs(S1);
    await expect(t.db.query(`select public.start_practice($1)`, [fullSet])).rejects.toThrow(/isn’t available/);
    attempt = (await t.one<{ id: string }>(`select public.start_practice($1) id`, [topicSet])).id;
    expect((await t.one<{ id: string }>(`select public.start_practice($1) id`, [topicSet])).id).toBe(attempt);
  });

  it("hides answers until a question is checked, then explains", async () => {
    state = await pstate(attempt);
    expect(state.questions).toHaveLength(3);
    expect(state.questions.every((q) => q.feedback === null)).toBe(true);
    expect(JSON.stringify(state)).not.toContain("Why 1");
    const wrong = await check(state.attemptModuleId, state.questions[0].id, "B");
    expect(wrong).toMatchObject({ isCorrect: false, correctAnswer: "A", explanation: "Why 1" });
    const again = await check(state.attemptModuleId, state.questions[0].id, "A");
    expect(again.isCorrect).toBe(false);
    expect((await check(state.attemptModuleId, state.questions[1].id, " a ")).isCorrect).toBe(true);
    expect((await pstate(attempt)).questions[0].feedback?.explanation).toBe("Why 1");
  });

  it("can't grade questions from outside the set", async () => {
    await expect(check(state.attemptModuleId, fullQuestion, "B")).rejects.toThrow(/isn’t in this practice/);
    await t.actAs(S2);
    await expect(check(state.attemptModuleId, state.questions[2].id, "A")).rejects.toThrow(/isn’t yours/);
  });

  it("finishes with a count of right answers", async () => {
    await t.actAs(S1);
    await t.db.query(`select public.finish_practice($1)`, [attempt]);
    const a = await t.one<{ status: string; raw_correct: number }>(`select status, raw_correct from public.attempts where id = $1`, [attempt]);
    expect(a).toEqual({ status: "completed", raw_correct: 1 });
    await expect(check(state.attemptModuleId, state.questions[2].id, "A")).rejects.toThrow(/already finished/);
  });
});

describe("mistakes", () => {
  it("lists only my wrong answers, with explanations", async () => {
    await t.actAs(S1);
    const list = (await t.one<{ m: { prompt: string; correctAnswer: string; timesWrong: number }[] }>(`select public.get_mistakes('english') m`)).m;
    expect(list.map((m) => m.prompt)).toEqual(["T1"]);
    expect(list[0]).toMatchObject({ correctAnswer: "A", timesWrong: 1 });
    // Each mistake says which practice it comes from, so the page can list practices first.
    expect(list[0]).toMatchObject({ setId: topicSet, setTitle: "Transitions 1", setKind: "topic", collection: "books" });
    await t.actAs(S2);
    expect((await t.one<{ m: unknown[] }>(`select public.get_mistakes('english') m`)).m).toEqual([]);
  });

  it("clears a mistake after two right answers in a row", async () => {
    await t.actAs(S1);
    const q = (await t.one<{ id: string }>(`select id from public.questions where prompt = 'T1'`)).id;
    expect((await t.one<{ f: Feedback }>(`select public.retry_mistake($1, 'A') f`, [q])).f).toMatchObject({ isCorrect: true, mastered: false });
    expect((await t.one<{ f: Feedback }>(`select public.retry_mistake($1, 'A') f`, [q])).f).toMatchObject({ isCorrect: true, mastered: true });
    expect((await t.one<{ m: unknown[] }>(`select public.get_mistakes('english') m`)).m).toEqual([]);
  });

  it("won't grade questions that aren't my mistakes (full-test answers stay secret)", async () => {
    await t.actAs(S2);
    await expect(t.db.query(`select public.retry_mistake($1, 'B')`, [fullQuestion])).rejects.toThrow(/isn’t in your mistakes/);
  });
});
