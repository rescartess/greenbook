import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000c1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000c2";
const S2 = "bbbbbbbb-0000-4000-8000-0000000000c3";
let t: Awaited<ReturnType<typeof freshDatabase>>;
let topic: string;

type Banner = { bio: string | null; correct: number; seconds: number; answered: number; bestScore: number | null; rank: number; students: number };

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.addUser(S2);
  await t.actAs(ADMIN);
  topic = (await t.one<{ id: string }>(`select id from public.question_sets where kind = 'topic' and title = 'Inferences' and collection = 'books'`)).id;
  const mod = (await t.one<{ id: string }>(`select id from public.modules where set_id = $1`, [topic])).id;
  const items = Array.from({ length: 3 }, (_, i) => ({
    prompt: `B${i}`,
    choices: [
      { id: "A", text: "a" },
      { id: "B", text: "b" },
    ],
    answer: "A",
    difficulty: "easy",
  }));
  await t.db.query(`select public.admin_add_questions($1, $2)`, [mod, JSON.stringify(items)]);
  await t.db.query(`update public.questions set status = 'published' where prompt like 'B%'`);
  await t.db.query(`update public.question_sets set published = true where id = $1`, [topic]);
});

const banner = async () => (await t.one<{ b: Banner }>(`select public.get_my_banner('english') b`)).b;

describe("dashboard banner", () => {
  it("starts empty", async () => {
    await t.actAs(S1);
    expect(await banner()).toMatchObject({ bio: null, seconds: 0, answered: 0, bestScore: null, students: 2 });
  });

  it("counts answers and time, and ranks students by correct answers in the subject", async () => {
    await t.actAs(S1);
    const id = (await t.one<{ id: string }>(`select public.start_topic_practice($1, 'easy', 1, 3, 'end', null, 'Mine') id`, [topic])).id;
    const am = await t.one<{ id: string; q: string[] }>(`select id, question_ids q from public.attempt_modules where attempt_id = $1`, [id]);
    await t.db.query(`select public.save_practice_response($1, $2, 'A', false, '{}')`, [am.id, am.q[0]]);
    await t.db.query(`select public.save_practice_response($1, $2, 'B', false, '{}')`, [am.id, am.q[1]]);
    await t.db.query(`select public.finish_practice($1)`, [id]);
    await t.actAsOwner();
    await t.db.query(`update public.attempts set started_at = finished_at - interval '25 minutes' where id = $1`, [id]);
    await t.actAs(S1);
    const b = await banner();
    expect(b.answered).toBe(2);
    expect(b.correct).toBe(1);
    expect(b.seconds).toBe(25 * 60);
    expect(b.rank).toBe(1);
    await t.actAs(S2);
    expect(await banner()).toMatchObject({ rank: 2, students: 2, seconds: 0, correct: 0 });
    // Math has its own ranking: no one has a Math answer right yet, so both are first.
    const math = (await t.one<{ b: Banner }>(`select public.get_my_banner('math') b`)).b;
    expect(math).toMatchObject({ rank: 1, correct: 0 });
  });

  it("caps a forgotten tab at 4 hours", async () => {
    await t.actAsOwner();
    await t.db.query(`update public.attempts set started_at = finished_at - interval '2 days' where name = 'Mine'`);
    await t.actAs(S1);
    expect((await banner()).seconds).toBe(4 * 3600);
  });

  it("lets a student write a short bio, not a long one", async () => {
    await t.actAs(S1);
    await t.db.query(`update public.profiles set bio = 'Faster than light.' where id = $1`, [S1]);
    expect((await banner()).bio).toBe("Faster than light.");
    await expect(t.db.query(`update public.profiles set bio = $2 where id = $1`, [S1, "x".repeat(161)])).rejects.toThrow();
  });
});
