import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const ADMIN = "aaaaaaaa-0000-4000-8000-0000000000a1";
const S1 = "bbbbbbbb-0000-4000-8000-0000000000a2";
let t: Awaited<ReturnType<typeof freshDatabase>>;

const password = (email: string, code: string) =>
  t.one<{ p: string }>(`select public.invite_code_password($1, $2) p`, [email, code]);
const anon = () => t.db.exec(`reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);`);

beforeAll(async () => {
  t = await freshDatabase();
  await t.db.exec(`grant usage on schema public to anon;`);
  await t.addUser(ADMIN, "admin");
  await t.addUser(S1);
});

describe("invite code", () => {
  it("is off until the admin sets one", async () => {
    await anon();
    await expect(password("new@test.local", "ANYTHING")).rejects.toThrow(/turned off/);
  });

  it("only an admin can set or read it, and it needs 6+ characters", async () => {
    await t.actAs(S1);
    await expect(t.one(`select public.admin_set_invite_code('SAT2026')`)).rejects.toThrow(/Admins only/);
    await expect(t.one(`select public.admin_get_invite_code()`)).rejects.toThrow(/Admins only/);
    await t.actAs(ADMIN);
    await expect(t.one(`select public.admin_set_invite_code('abc')`)).rejects.toThrow(/6 to 40/);
    await t.one(`select public.admin_set_invite_code(' sat2026 ')`);
    expect((await t.one<{ c: string }>(`select public.admin_get_invite_code() c`)).c).toBe("SAT2026");
  });

  it("refuses a wrong code and gives the same password for the right one, any case", async () => {
    await anon();
    await expect(password("new@test.local", "WRONG1")).rejects.toThrow(/Wrong invite code/);
    const a = await password("New@Test.local", "sat2026");
    const b = await password("new@test.local", "SAT2026");
    expect(a.p).toHaveLength(64);
    expect(a.p).toBe(b.p);
    expect((await password("other@test.local", "SAT2026")).p).not.toBe(a.p);
  });

  it("sets that password on an existing student account", async () => {
    await anon();
    const { p } = await password(`${S1.slice(0, 8)}@test.local`, "SAT2026");
    await t.actAsOwner();
    const row = await t.one<{ ok: boolean; confirmed: boolean }>(
      `select encrypted_password = extensions.crypt($2, encrypted_password) ok, email_confirmed_at is not null confirmed
       from auth.users where id = $1`,
      [S1, p],
    );
    expect(row).toEqual({ ok: true, confirmed: true });
  });

  it("can't be used to get into an admin account", async () => {
    await anon();
    await expect(password(`${ADMIN.slice(0, 8)}@test.local`, "SAT2026")).rejects.toThrow(/Admins log in/);
  });

  it("students can't read the stored code or secret", async () => {
    await t.actAs(S1);
    await expect(t.one(`select * from private.invite_code`)).rejects.toThrow();
  });
});
