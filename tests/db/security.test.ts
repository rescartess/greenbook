import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000a1";
const STUDENT = "bbbbbbbb-0000-4000-8000-0000000000b1";
let t: Awaited<ReturnType<typeof freshDatabase>>;

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(ADMIN, "admin");
  await t.addUser(STUDENT);
  await t.db.exec(`
    insert into public.questions (external_id, subject, difficulty, type, prompt, status) values
      ('draft-1','english','easy','mcq','Draft question','draft'),
      ('live-1','english','easy','mcq','Live question','published');
    insert into public.question_answers (question_id, correct_answer)
      select id, 'A' from public.questions;
  `);
});

describe("row rules", () => {
  it("students see published questions only and never answer keys", async () => {
    await t.actAs(STUDENT);
    const rows = await t.db.query<{ external_id: string }>(`select external_id from public.questions`);
    expect(rows.rows.map((r) => r.external_id)).toEqual(["live-1"]);
    expect((await t.one<{ n: number }>(`select count(*)::int n from public.question_answers`)).n).toBe(0);
  });

  it("students can't make themselves admin or add questions", async () => {
    await t.actAs(STUDENT);
    await expect(t.db.query(`update public.profiles set role = 'admin' where id = $1`, [STUDENT])).rejects.toThrow(/permission/);
    await expect(
      t.db.query(`insert into public.questions (external_id, subject, difficulty, type, prompt) values ('x','english','easy','mcq','x')`),
    ).rejects.toThrow(/policy|permission/);
  });

  it("students can rename themselves", async () => {
    await t.actAs(STUDENT);
    await t.db.query(`update public.profiles set display_name = 'Aziza' where id = $1`, [STUDENT]);
    expect((await t.one<{ display_name: string }>(`select display_name from public.profiles`)).display_name).toBe("Aziza");
  });

  it("admins see everything and editing a question raises its version", async () => {
    await t.actAs(ADMIN);
    expect((await t.one<{ n: number }>(`select count(*)::int n from public.question_answers`)).n).toBe(2);
    await t.db.query(`update public.questions set prompt = 'Changed' where external_id = 'draft-1'`);
    expect((await t.one<{ version: number }>(`select version from public.questions where external_id = 'draft-1'`)).version).toBe(2);
  });

  it("helper functions aren't callable from the website", async () => {
    await t.actAs(STUDENT);
    await expect(t.db.query(`select private.answer_matches('a','a','{}')`)).rejects.toThrow(/permission/);
  });
});
