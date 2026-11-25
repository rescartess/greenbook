"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_ENABLED, HOME_AFTER_LOGIN, safeNextPath } from "@/core/config/supabase";
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
