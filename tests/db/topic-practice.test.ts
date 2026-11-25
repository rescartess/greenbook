import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000e1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000e2";
const S2 = "bbbbbbbb-0000-4000-8000-0000000000e3";
let t: Awaited<ReturnType<typeof freshDatabase>>;
let boundaries: string;
let fullQuestion: string;

type Feedback = { answer: string | null; isCorrect: boolean; correctAnswer: string } | null;
type Q = { id: string; prompt: string; difficulty: string; answer: string | null; marked: boolean; feedback: Feedback };
type PState = {
  attemptModuleId: string;
  status: string;
  checkMode: string;
  options: { difficulty: string; from: number; to: number; minutes: number | null };
  deadlineAt: string | null;
  moreAfter: number;
  questions: Q[];
};
type Topic = { id: string; title: string; easy: number; medium: number; hard: number; done: number; open: number };

const LEVELS = ["easy", "easy", "medium", "easy", "hard", "medium", "easy"]; // B1..B7, in the admin's order

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.addUser(S2);
  await t.actAs(ADMIN);
  boundaries = (await t.one<{ id: string }>(`select id from public.question_sets where kind = 'topic' and title = 'Boundaries'`)).id;
  const mod = (await t.one<{ id: string }>(`select id from public.modules where set_id = $1`, [boundaries])).id;
  const items = LEVELS.map((difficulty, i) => ({
    prompt: `B${i + 1}`,
    choices: [
      { id: "A", text: "a" },
      { id: "B", text: "b" },
    ],
    answer: "A",
    difficulty,
  }));
  await t.db.query(`select public.admin_add_questions($1, $2)`, [mod, JSON.stringify(items)]);

  const full = (await t.one<{ id: string }>(`select public.admin_create_test('Full', 'english', 32) id`)).id;
  const m1 = (await t.one<{ id: string }>(`select id from public.modules where set_id = $1 and module_number = 1`, [full])).id;
  await t.db.query(`select public.admin_add_questions($1, $2)`, [m1, JSON.stringify([{ ...items[0], prompt: "F1", answer: "B" }])]);
  fullQuestion = (await t.one<{ id: string }>(`select id from public.questions where prompt = 'F1'`)).id;
  await t.db.query(`update public.question_sets set published = true where id = $1`, [full]);
});

const topics = async () => (await t.one<{ t: Topic[] }>(`select public.list_topics('english') t`)).t;
const start = async (difficulty: string, from: number, count: number, mode: string, minutes: number | null = null) =>
  (await t.one<{ id: string }>(`select public.start_topic_practice($1, $2, $3, $4, $5, $6) id`, [boundaries, difficulty, from, count, mode, minutes])).id;
const pstate = async (attempt: string) => (await t.one<{ s: PState }>(`select public.get_practice_state($1) s`, [attempt])).s;
const save = (am: string, q: string, answer: string | null, marked = false) =>
  t.db.query(`select public.save_practice_response($1, $2, $3, $4, '{}')`, [am, q, answer, marked]);
const check = async (am: string, q: string, a: string) =>
  (await t.one<{ f: Feedback }>(`select public.check_practice_answer($1, $2, $3) f`, [am, q, a])).f;

describe("topics", () => {
  it("comes with the ten English topics, hidden from students until published", async () => {
    await t.actAs(ADMIN);
    const all = await topics();
    expect(all.map((x) => x.title)).toEqual([
      "Boundaries",
      "Form, Structure, and Sense",
      "Transitions",
      "Student Notes",
      "Central Ideas and Details",
      "Inferences",
      "Command of Evidence",
      "Cross-Text Connections",
      "Text Structure and Purpose",
      "Words in Context",
    ]);
    // Admins can try draft questions before publishing.
    expect(all[0]).toMatchObject({ easy: 4, medium: 2, hard: 1 });
    await t.actAs(S1);
    expect(await topics()).toEqual([]);
    await expect(start("all", 1, 5, "each")).rejects.toThrow(/isn’t available/);
  });

  it("counts only published questions for students", async () => {
    await t.actAs(ADMIN);
    await t.db.query(`update public.questions set status = 'published' where prompt like 'B%' and prompt <> 'B7'`);
    await t.db.query(`update public.question_sets set published = true where id = $1`, [boundaries]);
    await t.actAs(S1);
    const [b] = await topics();
    expect(b).toMatchObject({ title: "Boundaries", easy: 3, medium: 2, hard: 1, done: 0, open: 0 });
    const topic = (await t.one<{ t: { items: { d: string; r: string | null }[] } }>(`select public.get_topic($1) t`, [boundaries])).t;
    expect(topic.items.map((i) => i.d)).toEqual(LEVELS.slice(0, 6));
    expect(JSON.stringify(topic)).not.toContain("B1");
  });
});

describe("practice from a topic", () => {
  it("gives every student the same questions in the admin's order", async () => {
    await t.actAs(S1);
    const a = await pstate(await start("easy", 2, 2, "each"));
    await t.actAs(S2);
    const b = await pstate(await start("easy", 2, 2, "each"));
    expect(a.questions.map((q) => q.prompt)).toEqual(["B2", "B4"]);
    expect(b.questions.map((q) => q.prompt)).toEqual(["B2", "B4"]);
    expect(a.options).toMatchObject({ difficulty: "easy", from: 2, to: 3 });
    expect(a.moreAfter).toBe(0);
    const all = await pstate(await start("all", 1, 4, "end"));
    expect(all.questions.map((q) => q.prompt)).toEqual(["B1", "B2", "B3", "B4"]);
    expect(all.moreAfter).toBe(2);
  });

  it("refuses ranges with no questions and bad options", async () => {
    await t.actAs(S1);
    await expect(start("hard", 2, 5, "each")).rejects.toThrow(/no questions in that range/);
    await expect(start("tricky", 1, 5, "each")).rejects.toThrow(/Pick a difficulty/);
    await expect(start("all", 1, 5, "sometimes")).rejects.toThrow(/when to check/);
    await expect(start("all", 1, 700, "each")).rejects.toThrow(/between 1 and 600/);
  });

  it("check as you go: nothing is graded until Check, then the answer is final", async () => {
    await t.actAs(S1);
    const attempt = await start("all", 1, 3, "each");
    let s = await pstate(attempt);
    const [q1, q2] = s.questions;
    await save(s.attemptModuleId, q1.id, "B", true);
    s = await pstate(attempt);
    expect(s.questions[0]).toMatchObject({ answer: "B", marked: true, feedback: null });
    expect(await check(s.attemptModuleId, q1.id, "B")).toMatchObject({ isCorrect: false, correctAnswer: "A" });
    await save(s.attemptModuleId, q1.id, "A", false); // can unmark, can't change the checked answer
    s = await pstate(attempt);
    expect(s.questions[0]).toMatchObject({ answer: "B", marked: false });
    await save(s.attemptModuleId, q2.id, "A"); // picked but never pressed Check
    await t.db.query(`select public.finish_practice($1)`, [attempt]);
    s = await pstate(attempt);
    expect(s.status).toBe("completed");
    expect(s.questions.map((q) => q.feedback?.isCorrect)).toEqual([false, true, false]);
    expect(s.questions[2].feedback).toMatchObject({ answer: null, correctAnswer: "A" });
    const a = await t.one<{ raw_correct: number }>(`select raw_correct from public.attempts where id = $1`, [attempt]);
    expect(a.raw_correct).toBe(1);
  });

  it("check at the end: no Check button on the server, everything graded when finished", async () => {
    await t.actAs(S2);
    const attempt = await start("medium", 1, 2, "end");
    let s = await pstate(attempt);
    await expect(check(s.attemptModuleId, s.questions[0].id, "A")).rejects.toThrow(/checked at the end/);
    await save(s.attemptModuleId, s.questions[0].id, "A");
    s = await pstate(attempt);
    expect(s.questions.every((q) => q.feedback === null)).toBe(true);
    expect(JSON.stringify(s)).not.toContain("correctAnswer");
    await t.db.query(`select public.finish_practice($1)`, [attempt]);
    s = await pstate(attempt);
    expect(s.questions.map((q) => q.feedback?.isCorrect)).toEqual([true, false]);
    await expect(save(s.attemptModuleId, s.questions[0].id, "B")).rejects.toThrow(/already finished/);
  });

  it("keeps the timer on the server", async () => {
    await t.actAs(S1);
    const attempt = await start("all", 1, 2, "end", 5);
    const s = await pstate(attempt);
    expect(s.deadlineAt).not.toBeNull();
    await t.actAsOwner();
    await t.db.query(`update public.attempt_modules set deadline_at = now() - interval '1 minute' where id = $1`, [s.attemptModuleId]);
    await t.actAs(S1);
    await expect(save(s.attemptModuleId, s.questions[0].id, "A")).rejects.toThrow(/Time is up/);
    await t.db.query(`select public.finish_practice($1)`, [attempt]);
    expect((await pstate(attempt)).status).toBe("completed");
  });

  it("shows unfinished practices on the topic page, only to their owner", async () => {
    await t.actAs(S1);
    const topic = (await t.one<{ t: { open: { answered: number; total: number }[]; items: { r: string | null }[] } }>(`select public.get_topic($1) t`, [boundaries])).t;
    expect(topic.open.length).toBe(1); // "easy #2-3" from the first test
    expect(topic.items[0].r).toBe("wrong");
    expect(topic.items[1].r).toBe("correct");
    const [b] = await topics();
    expect(b.done).toBeGreaterThan(0);
  });

  it("keeps practices and full-test answers private", async () => {
    await t.actAs(S1);
    const mine = await start("all", 1, 1, "each");
    const am = (await pstate(mine)).attemptModuleId;
    await expect(check(am, fullQuestion, "B")).rejects.toThrow(/isn’t in this practice/);
    await expect(save(am, fullQuestion, "B")).rejects.toThrow(/isn’t in this practice/);
    await t.actAs(S2);
    await expect(pstate(mine)).rejects.toThrow(/isn’t yours/);
    await expect(save(am, fullQuestion, "B")).rejects.toThrow(/isn’t yours/);
  });
});
