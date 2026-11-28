import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

// Migration 0030: table rights, name length, deleting your own account, the wrong-code limit.
const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000b1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000b2";
const S2 = "bbbbbbbb-0000-4000-8000-0000000000b3";
let t: Awaited<ReturnType<typeof freshDatabase>>;

const anon = () => t.db.exec(`reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);`);

beforeAll(async () => {
  t = await freshDatabase();
  await t.db.exec(`grant usage on schema public to anon;`);
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
  await t.addUser(S2);
});

describe("security hardening (0030)", () => {
  it("leaves visitors with no table rights and students without TRUNCATE", async () => {
    await t.actAsOwner();
    const r = await t.one<{ anon_read: boolean; anon_update: boolean; truncate: boolean; student_read: boolean }>(
      `select has_table_privilege('anon', 'public.questions', 'select') anon_read,
              has_column_privilege('anon', 'public.profiles', 'role', 'update') anon_update,
              has_table_privilege('authenticated', 'public.questions', 'truncate') truncate,
              has_table_privilege('authenticated', 'public.questions', 'select') student_read`,
    );
    expect(r).toEqual({ anon_read: false, anon_update: false, truncate: false, student_read: true });
  });

  it("keeps names between 1 and 40 characters, even past the form", async () => {
    await t.actAs(S1);
    await expect(t.db.query(`update public.profiles set display_name = $1 where id = $2`, ["x".repeat(41), S1])).rejects.toThrow(
      /profiles_display_name_length/,
    );
    await expect(t.db.query(`update public.profiles set display_name = '' where id = $1`, [S1])).rejects.toThrow(
      /profiles_display_name_length/,
    );
    await t.db.query(`update public.profiles set display_name = $1 where id = $2`, ["x".repeat(40), S1]);
  });

  it("lets a student delete their own account and everything in it, never someone else's", async () => {
    await anon();
    await expect(t.one(`select public.delete_my_account()`)).rejects.toThrow(/permission denied|Sign in first/);
    await t.actAs(ADMIN);
    await expect(t.one(`select public.delete_my_account()`)).rejects.toThrow(/admin account/);
    await t.actAs(S2);
    await t.one(`select public.delete_my_account()`);
    await t.actAsOwner();
    const left = await t.one<{ users: number; profiles: number; others: number }>(
      `select (select count(*)::int from auth.users where id = $1) users,
              (select count(*)::int from public.profiles where id = $1) profiles,
              (select count(*)::int from auth.users where id in ($2, $3)) others`,
      [S2, S1, ADMIN],
    );
    expect(left).toEqual({ users: 0, profiles: 0, others: 2 });
  });

  it("stops answering the class code after 20 wrong codes in 10 minutes", async () => {
    await t.actAs(ADMIN);
    await t.one(`select public.admin_set_invite_code('RIGHTCODE')`);
    await t.actAsOwner();
    await t.db.exec(`insert into private.code_failures select now() from generate_series(1, 20);`);
    await anon();
    await expect(t.one(`select public.invite_code_password('new@test.local', 'RIGHTCODE') p`)).rejects.toThrow(/Too many wrong codes/);
    await t.actAsOwner();
    await t.db.exec(`update private.code_failures set at = now() - interval '11 minutes';`);
    await anon();
    const ok = await t.one<{ p: string }>(`select public.invite_code_password('new@test.local', 'RIGHTCODE') p`);
    expect(ok.p).toHaveLength(64);
  });
});
