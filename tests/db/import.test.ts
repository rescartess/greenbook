import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000f1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000f2";
let t: Awaited<ReturnType<typeof freshDatabase>>;
let topic: string;

const item = (n: number, extra: Record<string, unknown> = {}) => ({
  source: `Book Q${n}`,
  skill: "english-command-of-evidence-quantitative",
  difficulty: n === 1 ? "easy" : "hard",
  passage: `Passage ${n}`,
  prompt: `Prompt ${n}`,
  choices: [
    { id: "A", text: "a" },
    { id: "B", text: "b" },
    { id: "C", text: "c" },
    { id: "D", text: "d" },
  ],
  answer: "C",
  image: n === 1 ? "dovudprep/ii/001.webp" : null,
  ...extra,
});

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.actAsOwner();
  topic = (await t.one<{ id: string }>(`select id from public.question_sets where title = 'Command of Evidence' and collection = 'books'`)).id;
});

const importItems = (items: unknown[]) =>
  t.one<{ n: number }>(`select public.admin_import_questions($1, $2) n`, [topic, JSON.stringify(items)]);

describe("importing a book", () => {
  it("adds questions to the end of a topic, in order, as drafts", async () => {
    await t.actAs(ADMIN);
    expect((await importItems([item(1), item(2)])).n).toBe(2);
    const rows = (
      await t.db.query<{ prompt: string; position: number; status: string; image_path: string | null; slug: string }>(
        `select q.prompt, mq.position, q.status, q.image_path, s.slug from public.module_questions mq
         join public.modules m on m.id = mq.module_id join public.questions q on q.id = mq.question_id
         join public.skills s on s.id = q.skill_id where m.set_id = $1 order by mq.position`,
        [topic],
      )
    ).rows;
    expect(rows.map((r) => [r.prompt, r.position, r.status])).toEqual([
      ["Prompt 1", 1, "draft"],
      ["Prompt 2", 2, "draft"],
    ]);
    expect(rows[0]).toMatchObject({ image_path: "dovudprep/ii/001.webp", slug: "english-command-of-evidence-quantitative" });
  });

  it("skips questions already imported, so it can be run again", async () => {
    expect((await importItems([item(1), item(2), item(3)])).n).toBe(1);
    const n = (await t.one<{ n: number }>(`select count(*)::int n from public.questions`)).n;
    expect(n).toBe(3);
  });

  it("refuses incomplete questions and non-admins", async () => {
    await expect(importItems([item(4, { answer: null })])).rejects.toThrow(/incomplete/);
    await t.actAs(S1);
    await expect(importItems([item(5)])).rejects.toThrow(/Only the admin/);
  });

  it("shows the picture with the question in practice", async () => {
    await t.actAs(ADMIN);
    await t.db.query(`update public.questions set status = 'published'`);
    await t.db.query(`update public.question_sets set published = true where id = $1`, [topic]);
    await t.actAs(S1);
    const id = (await t.one<{ id: string }>(`select public.start_topic_practice($1, 'all', 1, 3, 'each', null) id`, [topic])).id;
    const s = (await t.one<{ s: { questions: { image: string | null }[] } }>(`select public.get_practice_state($1) s`, [id])).s;
    expect(s.questions.map((q) => q.image)).toEqual(["dovudprep/ii/001.webp", null, null]);
  });
});
