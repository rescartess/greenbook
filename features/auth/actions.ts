"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_ENABLED, HOME_AFTER_LOGIN, safeNextPath, GOOGLE_LOGIN } from "@/core/config/supabase";
import { createDbClient } from "@/core/db/server";
import { codeErrorMessage, parseCodeForm, parseLoginForm, type CodeLoginState, type LoginState } from "./schema";

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Emails the student a one-time sign-in link. Creates the account on first use. */
export async function sendLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = parseLoginForm(formData);
  if (!parsed.ok) return { status: "error", message: parsed.message };
  if (!AUTH_ENABLED) redirect(HOME_AFTER_LOGIN);

  const supabase = await createDbClient();
  const next = safeNextPath(parsed.next);
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    const tooMany = error.status === 429 || /rate limit/i.test(error.message);
    return {
      status: "error",
      message: tooMany
        ? "Too many sign-in emails were sent just now. Wait a few minutes and try again."
        : "We couldn’t send the email. Check the address and try again.",
    };
  }
  return { status: "sent", email: parsed.email };
}

/**
 * "Continue with Google" (owner request 27 Nov 2026: the main way in for everyone). Sends the student to
 * Google; Google sends them back to /auth/callback, which signs them in. The first time it makes their
 * account (name from Google). A student who already joined with the same email lands in the same account.
 */
export async function loginWithGoogle(formData: FormData): Promise<void> {
  if (!AUTH_ENABLED) redirect(HOME_AFTER_LOGIN);
  if (!GOOGLE_LOGIN) redirect("/login");
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const supabase = await createDbClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/login?google=failed");
  redirect(data.url);
}

/** Logs a student in with their email and the shared invite code. Creates the account on first use. */
export async function loginWithInviteCode(_prev: CodeLoginState, formData: FormData): Promise<CodeLoginState> {
  const parsed = parseCodeForm(formData);
  if (!parsed.ok) return { status: "error", message: parsed.message };
  if (!AUTH_ENABLED) redirect(HOME_AFTER_LOGIN);

  const supabase = await createDbClient();
  const { data: password, error } = await supabase.rpc("invite_code_password", {
    p_email: parsed.email,
    p_code: parsed.code,
  });
  if (error || !password) return { status: "error", message: codeErrorMessage(error?.code) };

  const signIn = await supabase.auth.signInWithPassword({ email: parsed.email, password });
  if (signIn.error) {
    // No account yet: make one. ("Confirm email" is off in Supabase, so this signs them in.)
    const signUp = await supabase.auth.signUp({ email: parsed.email, password });
    if (signUp.error || !signUp.data.session) {
      const tooMany = signUp.error?.status === 429;
      return {
        status: "error",
        message: tooMany
          ? "Too many people are joining at once. Wait a minute and try again."
          : "We couldn’t create your account. Tell your teacher.",
      };
    }
  }
  redirect(safeNextPath(parsed.next));
}

/** Signs the student out on this device. */
export async function signOut(): Promise<void> {
  if (AUTH_ENABLED) {
    const supabase = await createDbClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
