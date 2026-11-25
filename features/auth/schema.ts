export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Checks the login form before anything is sent. */
export function parseLoginForm(
  formData: FormData,
): { ok: true; email: string; next: string | null } | { ok: false; message: string } {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nextRaw = formData.get("next");
  if (!email) return { ok: false, message: "Enter your email address." };
  if (email.length > 254 || !EMAIL.test(email)) return { ok: false, message: "That email address doesn’t look right." };
  return { ok: true, email, next: typeof nextRaw === "string" ? nextRaw : null };
}

export type CodeLoginState = { status: "idle" } | { status: "error"; message: string };

/** Checks the invite-code form: an email and the code the teacher gave out. */
export function parseCodeForm(
  formData: FormData,
): { ok: true; email: string; code: string; next: string | null } | { ok: false; message: string } {
  const base = parseLoginForm(formData);
  if (!base.ok) return base;
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { ok: false, message: "Enter the invite code you were given." };
  return { ok: true, email: base.email, code, next: base.next };
}

/** Plain words for the database's invite-code errors. */
export function codeErrorMessage(dbCode: string | undefined): string {
  switch (dbCode) {
    case "P0010":
      return "Invite codes aren’t open right now. Use an emailed sign-in link instead.";
    case "P0011":
      return "That invite code isn’t right. Check it and try again.";
    case "P0012":
      return "That email address doesn’t look right.";
    case "P0013":
      return "This account logs in with an emailed link. Choose “Email me a sign-in link” below.";
    default:
      return "We couldn’t log you in. Try again in a minute.";
  }
}
