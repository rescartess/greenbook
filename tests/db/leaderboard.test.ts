import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000d1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000d2";
const S2 = "bbbbbbbb-0000-4000-8000-0000000000d3";
const S3 = "bbbbbbbb-0000-4000-8000-0000000000d4";
let t: Awaited<ReturnType<typeof freshDatabase>>;

type Row = { id: string; rank: number; name: string; seconds: number; me: boolean; email?: string };
type Board = { students: number; rows: Row[] };

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.addUser(S2);
  await t.addUser(S3);
  await t.actAs(ADMIN);
  const topic = (await t.one<{ id: string }>(`select id from public.question_sets where kind = 'topic' and title = 'Inferences' and collection = 'books'`)).id;
  const mod = (await t.one<{ id: string }>(`select id from public.modules where set_id = $1`, [topic])).id;
  const items = Array.from({ length: 2 }, (_, i) => ({
    prompt: `L${i}`,
    choices: [
      { id: "A", text: "a" },
      { id: "B", text: "b" },
    ],
    answer: "A",
    difficulty: "easy",
  }));
  await t.db.query(`select public.admin_add_questions($1, $2)`, [mod, JSON.stringify(items)]);
  await t.db.query(`update public.questions set status = 'published' where prompt like 'L%'`);
  await t.db.query(`update public.question_sets set published = true where id = $1`, [topic]);

  // S2 practices 40 minutes, S1 10 minutes, S3 nothing.
  for (const [who, minutes] of [
    [S2, 40],
    [S1, 10],
  ] as const) {
    await t.actAs(who);
    const id = (await t.one<{ id: string }>(`select public.start_topic_practice($1, 'easy', 1, 2, 'end', null, 'P') id`, [topic])).id;
    const am = await t.one<{ id: string; q: string[] }>(`select id, question_ids q from public.attempt_modules where attempt_id = $1`, [id]);
    await t.db.query(`select public.save_practice_response($1, $2, 'A', false, '{}')`, [am.id, am.q[0]]);
    await t.db.query(`select public.finish_practice($1)`, [id]);
    await t.actAsOwner();
    await t.db.query(`update public.attempts set started_at = finished_at - make_interval(mins => $2) where id = $1`, [id, minutes]);
  }
  await t.actAsOwner();
  await t.db.query(`update public.profiles set display_name = 'Aziza', bio = 'Faster than light.' where id = $1`, [S2]);
});

const board = async () => (await t.one<{ b: Board }>(`select public.list_leaderboard('english') b`)).b;

describe("leaderboard", () => {
  it("ranks students by time practicing, without admins or emails", async () => {
    await t.actAs(S3);
    const b = await board();
    expect(b.students).toBe(3);
    expect(b.rows.map((r) => r.id)).toEqual([S2, S1, S3]);
    expect(b.rows[0]).toMatchObject({ rank: 1, name: "Aziza", seconds: 40 * 60, me: false });
    expect(b.rows[1].name).not.toContain("@");
    expect(b.rows[2].me).toBe(true);
    expect(JSON.stringify(b)).not.toContain("@");
    expect(b.rows.some((r) => r.id === ADMIN)).toBe(false);
  });

  it("always includes the caller, even below the limit", async () => {
    await t.actAs(S3);
    const b = (await t.one<{ b: Board }>(`select public.list_leaderboard('english', 1) b`)).b;
    expect(b.rows.map((r) => r.id)).toEqual([S2, S3]);
  });

  it("opens a student's public profile, but not an admin's", async () => {
    await t.actAs(S1);
    const p = (await t.one<{ p: Record<string, unknown> }>(`select public.get_student_profile($1, 'english') p`, [S2])).p;
    expect(p).toMatchObject({ name: "Aziza", bio: "Faster than light.", rank: 1, students: 3, answered: 1, me: false });
    expect(p).not.toHaveProperty("email");
    expect(p).not.toHaveProperty("role");
    const admin = (await t.one<{ p: unknown }>(`select public.get_student_profile($1, 'english') p`, [ADMIN])).p;
    expect(admin).toBeNull();
  });
});
