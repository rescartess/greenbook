import { beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./db";

const S1 = "bbbbbbbb-0000-4000-8000-0000000000a1";
const S2 = "bbbbbbbb-0000-4000-8000-0000000000a2";
let t: Awaited<ReturnType<typeof freshDatabase>>;

beforeAll(async () => {
  t = await freshDatabase();
  await t.addUser(S1);
  await t.addUser(S2);
});

const mine = async () =>
  t.one<{ accent_color: string | null; background_color: string | null; avatar_path: string | null; test_date: string | null }>(
    `select accent_color, background_color, avatar_path, test_date::text from public.profiles where id = $1`,
    [S1],
  );

describe("profile settings", () => {
  it("lets a student save two colors, a photo in their own folder and an SAT date", async () => {
    await t.actAs(S1);
    await t.db.query(
      `update public.profiles set accent_color = '#3355cc', background_color = '#f0e6d2', avatar_path = $2, test_date = '2027-03-13' where id = $1`,
      [S1, `${S1}/abc123.webp`],
    );
    expect(await mine()).toEqual({ accent_color: "#3355cc", background_color: "#f0e6d2", avatar_path: `${S1}/abc123.webp`, test_date: "2027-03-13" });
    await t.db.query(`update public.profiles set accent_color = null, background_color = null where id = $1`, [S1]);
    expect((await mine()).accent_color).toBeNull();
  });

  it("refuses colors that aren't #rrggbb and photos outside the student's folder", async () => {
    await t.actAs(S1);
    await expect(t.db.query(`update public.profiles set accent_color = 'red' where id = $1`, [S1])).rejects.toThrow();
    await expect(t.db.query(`update public.profiles set accent_color = '#FFF' where id = $1`, [S1])).rejects.toThrow();
    await expect(t.db.query(`update public.profiles set avatar_path = $2 where id = $1`, [S1, `${S2}/x.webp`])).rejects.toThrow();
    await expect(t.db.query(`update public.profiles set avatar_path = $2 where id = $1`, [S1, `${S1}/x.png`])).rejects.toThrow();
    await t.db.query(`update public.profiles set avatar_path = $2 where id = $1`, [S1, `${S1}/fromsafari.jpg`]);
  });

  it("still can't change their role or someone else's profile", async () => {
    await t.actAs(S1);
    await expect(t.db.query(`update public.profiles set role = 'admin' where id = $1`, [S1])).rejects.toThrow();
    await t.db.query(`update public.profiles set accent_color = '#112233' where id = $1`, [S2]);
    await t.actAsOwner();
    const other = await t.one<{ accent_color: string | null }>(`select accent_color from public.profiles where id = $1`, [S2]);
    expect(other.accent_color).toBeNull();
  });
});
