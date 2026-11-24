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
