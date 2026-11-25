import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A throwaway Postgres in memory with every migration applied, plus a tiny
 * stand-in for Supabase's auth schema. Lets tests act as a student or an admin.
 */
export async function freshDatabase() {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    create role authenticated; create role anon;
    create schema auth; create schema extensions;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}'::jsonb,
      encrypted_password text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to authenticated;
    -- Like Supabase: new tables are open to signed-in users by default; migrations then narrow this down.
    alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
  `);
  const dir = join(process.cwd(), "supabase/migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }

  return {
    db,
    async addUser(id: string, role: "student" | "admin" = "student") {
      await db.query(`insert into auth.users (id, email) values ($1, $2)`, [id, `${id.slice(0, 8)}@test.local`]);
      if (role === "admin") await db.query(`update public.profiles set role = 'admin' where id = $1`, [id]);
    },
    async actAs(userId: string) {
      await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
    },
    async actAsOwner() {
      await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
    },
    async one<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T> {
      return (await db.query<T>(sql, params)).rows[0];
    },
  };
}
