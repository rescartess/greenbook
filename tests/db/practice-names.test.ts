import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000f1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000f2";
const S2 = "bbbbbbbb-0000-4000-8000-0000000000f3";
let t: Awaited<ReturnType<typeof freshDatabase>>;
let boundaries: string;

type Mod = { number: number | null; total: number; answered: number; correct: number | null };
type Row = { id: string; name: string | null; setTitle: string; setKind: string; status: string; rawCorrect: number | null; modules: Mod[] };

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.addUser(S2);
  await t.actAs(ADMIN);
  boundaries = (await t.one<{ id: string }>(`select id from public.question_sets where kind = 'topic' and title = 'Boundaries' and collection = 'books'`)).id;
  const mod = (await t.one<{ id: string }>(`select id from public.modules where set_id = $1`, [boundaries])).id;
  const items = Array.from({ length: 4 }, (_, i) => ({
    prompt: `N${i + 1}`,
    choices: [
      { id: "A", text: "a" },
      { id: "B", text: "b" },
    ],
    answer: "A",
    difficulty: "easy",
  }));
  await t.db.query(`select public.admin_add_questions($1, $2)`, [mod, JSON.stringify(items)]);
  await t.db.query(`update public.questions set status = 'published' where prompt like 'N%'`);
  await t.db.query(`update public.question_sets set published = true where id = $1`, [boundaries]);
});

const start = async (name: string | null) =>
  (await t.one<{ id: string }>(`select public.start_topic_practice($1, 'easy', 1, 4, 'end', null, $2) id`, [boundaries, name])).id;
const list = async () => (await t.one<{ l: Row[] }>(`select public.list_my_attempts('english') l`)).l;
const firstModule = async (attempt: string) =>
  (await t.one<{ id: string; q: string[] }>(`select id, question_ids q from public.attempt_modules where attempt_id = $1`, [attempt]));

describe("practice names and the Results list", () => {
  it("keeps the name a student gives a practice, tidied", async () => {
    await t.actAs(S1);
    const id = await start("  Monday   boundaries ");
    const rows = await list();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id, name: "Monday boundaries", setTitle: "Boundaries", setKind: "topic", status: "in_progress" });
  });

  it("allows no name, refuses one over 60 characters", async () => {
    await t.actAs(S1);
    await start(null);
    expect((await list())[0].name).toBeNull();
    await expect(start("x".repeat(61))).rejects.toThrow(/60 characters/);
  });

  it("never shows correct counts before a practice is finished", async () => {
    await t.actAs(S1);
    const id = await start("Counted");
    const am = await firstModule(id);
    await t.db.query(`select public.save_practice_response($1, $2, 'A', false, '{}')`, [am.id, am.q[0]]);
    await t.db.query(`select public.save_practice_response($1, $2, 'B', false, '{}')`, [am.id, am.q[1]]);
    let row = (await list()).find((r) => r.id === id)!;
    expect(row.modules).toEqual([expect.objectContaining({ total: 4, answered: 2, correct: null })]);
    expect(row.rawCorrect).toBeNull();
    await t.db.query(`select public.finish_practice($1)`, [id]);
    row = (await list()).find((r) => r.id === id)!;
    expect(row.status).toBe("completed");
    expect(row.modules[0]).toMatchObject({ total: 4, answered: 2, correct: 1 });
  });

  it("lists only the student's own attempts, and not deleted ones", async () => {
    await t.actAs(S2);
    expect(await list()).toEqual([]);
    const id = await start("Gone");
    await t.db.query(`select public.abandon_test($1)`, [id]);
    expect(await list()).toEqual([]);
  });
});
