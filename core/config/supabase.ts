/**
 * Supabase connection details. The URL and the publishable (anon) key are
 * public by design: security comes from the database's Row Level Security
 * rules, not from hiding these values.
 *
 * Until both are set, login is switched off and the app shows sample data,
 * so the live site keeps working while the database is being set up.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const AUTH_ENABLED = SUPABASE_URL !== "" && SUPABASE_PUBLISHABLE_KEY !== "";

/** Where a signed-in student lands by default. */
export const HOME_AFTER_LOGIN = "/english/dashboard";

/** Only allow redirects to our own pages (blocks "?next=https://evil.example"). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return HOME_AFTER_LOGIN;
  return next;
}
