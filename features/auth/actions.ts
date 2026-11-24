"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_ENABLED, HOME_AFTER_LOGIN, safeNextPath } from "@/core/config/supabase";
import { createDbClient } from "@/core/db/server";
import { parseLoginForm, type LoginState } from "./schema";

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

/** Signs the student out on this device. */
export async function signOut(): Promise<void> {
  if (AUTH_ENABLED) {
    const supabase = await createDbClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
