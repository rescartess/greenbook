/**
 * Supabase connection details. The URL and the publishable (anon) key are
 * public by design: security comes from the database's Row Level Security
 * rules, not from hiding these values.
 *
 * The defaults point at the live project (greenbook, Frankfurt). Environment
 * variables can override them, for example to use a test project. Setting
 * NEXT_PUBLIC_SUPABASE_URL to "off" switches login off and shows sample data.
 */
const LIVE_URL = "https://pgpotvnyomwrlmnhzcmy.supabase.co";
const LIVE_PUBLISHABLE_KEY = "sb_publishable_PnGwMmSZwM1AI-_GrUH1Gg_UDPdldiJ";

const urlSetting = process.env.NEXT_PUBLIC_SUPABASE_URL || LIVE_URL;
export const SUPABASE_URL = urlSetting === "off" ? "" : urlSetting;
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || LIVE_PUBLISHABLE_KEY;

export const AUTH_ENABLED = SUPABASE_URL !== "" && SUPABASE_PUBLISHABLE_KEY !== "";

/**
 * "Continue with Google" on the login page. Turn on only after Supabase Auth › Providers › Google
 * is enabled and saved with the client secret; otherwise the button opens an error page.
 */
export const GOOGLE_LOGIN = true;

/**
 * "Have a class code?" on the login page. Off since 28 Nov 2026 (owner request): everyone signs in
 * with Google; the code itself was switched off in the database too (Admin › Student login, empty).
 * To bring it back: set a code there and turn this on.
 */
export const CLASS_CODE_LOGIN = false;

/** Where a signed-in student lands by default. */
export const HOME_AFTER_LOGIN = "/english/dashboard";

/** Only allow redirects to our own pages (blocks "?next=https://evil.example"). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return HOME_AFTER_LOGIN;
  return next;
}
