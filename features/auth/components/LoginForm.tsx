"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { CLASS_CODE_LOGIN, GOOGLE_LOGIN } from "@/core/config/supabase";
import { GoogleMark } from "@/core/design/ui";
import { Btn } from "@/core/shell";
import { loginWithGoogle, loginWithInviteCode, sendLoginLink } from "../actions";
import type { CodeLoginState, LoginState } from "../schema";

const START: LoginState = { status: "idle" };
const CODE_START: CodeLoginState = { status: "idle" };

const FIELD =
  "h-11 rounded-[10px] border border-hairline bg-paper px-3.5 text-[16px] text-ink placeholder:text-graphite focus:border-pine focus:outline-none";

type Way = "google" | "code" | "link";

/**
 * Everyone signs in with Google (owner request 27 Nov 2026). The class code is switched off
 * (`CLASS_CODE_LOGIN`, 28 Nov 2026); the emailed link is for admins.
 */
export function LoginForm() {
  const params = useSearchParams();
  const expired = params.get("expired") === "1";
  const googleFailed = params.get("google") === "failed";
  const [way, setWay] = useState<Way>(expired ? "link" : GOOGLE_LOGIN || !CLASS_CODE_LOGIN ? "google" : "code");
  const next = params.get("next") ?? "";

  return (
    <>
      {GOOGLE_LOGIN ? (
        <>
          <form action={loginWithGoogle} className="mt-7">
            <input type="hidden" name="next" value={next} />
            <GoogleButton />
          </form>
          {googleFailed ? (
            <p className="mt-3 text-sm font-semibold text-ink" role="alert">
              Google didn’t let that through. Try again.
            </p>
          ) : null}

          <div className="my-6 flex items-center gap-3 text-[13px] text-graphite" aria-hidden="true">
            <span className="h-px flex-1 bg-hairline" />
            or
            <span className="h-px flex-1 bg-hairline" />
          </div>
        </>
      ) : (
        <div className="mt-7" />
      )}

      {way === "code" ? <CodeForm next={next} /> : null}
      {way === "link" ? <LinkForm next={next} expired={expired} /> : null}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {CLASS_CODE_LOGIN && way !== "code" ? (
          <button type="button" onClick={() => setWay("code")} className="text-[14px] font-semibold text-graphite underline-offset-4 hover:text-ink hover:underline">
            Have a class code?
          </button>
        ) : null}
        {way !== "link" ? (
          <button type="button" onClick={() => setWay("link")} className="text-[14px] font-semibold text-graphite underline-offset-4 hover:text-ink hover:underline">
            Email me a link
          </button>
        ) : null}
      </div>
    </>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-[var(--fp-r-btn)] border border-control bg-paper text-[16px] font-bold text-ink transition-colors hover:bg-mist disabled:opacity-60"
    >
      <GoogleMark size={20} />
      {pending ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}

function CodeForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginWithInviteCode, CODE_START);
  const error = state.status === "error" ? state.message : null;
  return (
    <form action={action} className="flex flex-col gap-2 text-left" noValidate>
      <input type="hidden" name="next" value={next} />
      <label htmlFor="code-email" className="text-[14px] font-semibold">
        Email
      </label>
      <input
        id="code-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="you@example.com"
        className={FIELD}
      />
      <label htmlFor="code" className="mt-3 text-[14px] font-semibold">
        Invite code
      </label>
      <input
        id="code"
        name="code"
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        required
        placeholder="From your teacher"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "code-error" : undefined}
        className={`${FIELD} uppercase placeholder:normal-case`}
      />
      {error ? (
        <p id="code-error" className="text-sm font-semibold text-ink" role="alert">
          {error}
        </p>
      ) : null}
      <Btn type="submit" className="mt-4 h-11 w-full text-[16px]" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Btn>
    </form>
  );
}

function LinkForm({ next, expired }: { next: string; expired: boolean }) {
  const [state, action, pending] = useActionState(sendLoginLink, START);

  if (state.status === "sent") {
    return (
      <div className="mt-7 text-left" role="status">
        <p className="text-[17px] font-bold">Check your email</p>
        <p className="mt-2 text-[15px] leading-relaxed text-graphite">
          We sent a sign-in link to <span className="font-bold text-ink">{state.email}</span>. Open it on this device
          to continue. It can take a minute to arrive; check spam if you don’t see it.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 text-left" noValidate>
      <input type="hidden" name="next" value={next} />
      {expired && state.status === "idle" ? (
        <p className="mb-2 rounded-[10px] border border-hairline bg-mist px-4 py-3 text-[14px] font-semibold text-ink" role="status">
          That sign-in link has expired or was already used. Enter your email for a new one.
        </p>
      ) : null}
      <label htmlFor="email" className="text-[14px] font-semibold">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="you@example.com"
        aria-invalid={state.status === "error"}
        aria-describedby={state.status === "error" ? "email-error" : undefined}
        className={FIELD}
      />
      {state.status === "error" ? (
        <p id="email-error" className="text-sm font-semibold text-ink" role="alert">
          {state.message}
        </p>
      ) : null}
      <Btn type="submit" className="mt-4 h-11 w-full text-[16px]" disabled={pending}>
        {pending ? "Sending link…" : "Email me a sign-in link"}
      </Btn>
    </form>
  );
}
