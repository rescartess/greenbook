import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000e1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000e2";
const S2 = "bbbbbbbb-0000-4000-8000-0000000000e3";
let t: Awaited<ReturnType<typeof freshDatabase>>;

type Row = { id: string; name: string; email: string; role: string; seconds: number; answered: number; correct: number; finished: number; via: string };
type List = { totals: { students: number; activeToday: number; seconds: number; answered: number }; rows: Row[] };
type Student = {
  id: string;
  email: string;
  via: string;
  seconds: number;
  answered: number;
  correct: number;
  rank: number;
  students: number;
  subjects: { subject: string; answered: number }[];
  days: { day: string; seconds: number }[];
  attempts: { title: string; kind: string; answered: number; correct: number; total: number; status: string }[];
};

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.addUser(S2);
  await t.actAs(ADMIN);
  const topic = (await t.one<{ id: string }>(`select id from public.question_sets where kind = 'topic' and title = 'Inferences' and collection = 'books'`)).id;
  const mod = (await t.one<{ id: string }>(`select id from public.modules where set_id = $1`, [topic])).id;
  const items = Array.from({ length: 2 }, (_, i) => ({
    prompt: `S${i}`,
    choices: [
      { id: "A", text: "a" },
      { id: "B", text: "b" },
    ],
    answer: "A",
    difficulty: "easy",
  }));
  await t.db.query(`select public.admin_add_questions($1, $2)`, [mod, JSON.stringify(items)]);
  await t.db.query(`update public.questions set status = 'published' where prompt like 'S_'`);
  await t.db.query(`update public.question_sets set published = true where id = $1`, [topic]);

  // S1 practices 25 minutes: one right, one wrong.
  await t.actAs(S1);
  const id = (await t.one<{ id: string }>(`select public.start_topic_practice($1, 'easy', 1, 2, 'end', null, 'Warm-up') id`, [topic])).id;
  const am = await t.one<{ id: string; q: string[] }>(`select id, question_ids q from public.attempt_modules where attempt_id = $1`, [id]);
  await t.db.query(`select public.save_practice_response($1, $2, 'A', false, '{}')`, [am.id, am.q[0]]);
  await t.db.query(`select public.save_practice_response($1, $2, 'B', false, '{}')`, [am.id, am.q[1]]);
  await t.db.query(`select public.finish_practice($1)`, [id]);
  await t.actAsOwner();
  await t.db.query(`update public.attempts set started_at = finished_at - interval '25 minutes' where id = $1`, [id]);
  await t.db.query(`update auth.users set raw_app_meta_data = '{"provider":"google","providers":["google"]}' where id = $1`, [S1]);
});

describe("admin students", () => {
  it("is closed to students", async () => {
    await t.actAs(S1);
    await expect(t.db.query(`select public.admin_list_students()`)).rejects.toThrow(/Only admins/);
    await expect(t.db.query(`select public.admin_get_student($1)`, [S2])).rejects.toThrow(/Only admins/);
  });

  it("lists every account with its numbers and totals", async () => {
    await t.actAs(ADMIN);
    const list = (await t.one<{ l: List }>(`select public.admin_list_students() l`)).l;
    expect(list.totals.students).toBe(2);
    expect(list.totals.seconds).toBe(25 * 60);
    expect(list.totals.answered).toBe(2);
    const s1 = list.rows.find((r) => r.id === S1)!;
    expect(s1).toMatchObject({ role: "student", seconds: 25 * 60, answered: 2, correct: 1, finished: 1, via: "google" });
    expect(s1.email).toContain("@");
    expect(list.rows.find((r) => r.id === ADMIN)?.role).toBe("admin");
  });

  it("opens one student with subjects, days, topics and recent work", async () => {
    await t.actAs(ADMIN);
    const s = (await t.one<{ s: Student }>(`select public.admin_get_student($1) s`, [S1])).s;
    expect(s).toMatchObject({ seconds: 25 * 60, answered: 2, correct: 1, rank: 1, students: 2, via: "google" });
    expect(s.subjects.map((x) => x.subject)).toEqual(["english", "math"]);
    expect(s.subjects[0]!.answered).toBe(2);
    expect(s.days).toHaveLength(30);
    expect(s.attempts[0]).toMatchObject({ title: "Warm-up", kind: "topic", answered: 2, correct: 1, total: 2, status: "completed" });
    expect(JSON.stringify(s)).not.toMatch(/"answer"/);
    expect((await t.one<{ s: Student | null }>(`select public.admin_get_student('00000000-0000-4000-8000-000000000000') s`)).s).toBeNull();
  });
});
