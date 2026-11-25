"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/core/design/ui";
import { loginWithInviteCode, sendLoginLink } from "../actions";
import type { CodeLoginState, LoginState } from "../schema";

const START: LoginState = { status: "idle" };
const CODE_START: CodeLoginState = { status: "idle" };

const FIELD =
  "h-12 rounded-choice border-[1.5px] border-control bg-paper px-4 text-base text-ink placeholder:text-graphite focus:border-pine focus:outline-none";

/** Students log in with their email and the invite code; admins use the emailed link. */
export function LoginForm() {
  const params = useSearchParams();
  const expired = params.get("expired") === "1";
  const [useLink, setUseLink] = useState(expired);
  const next = params.get("next") ?? "";

  return (
    <>
      {useLink ? <LinkForm next={next} expired={expired} /> : <CodeForm next={next} />}
      <button
        type="button"
        onClick={() => setUseLink(!useLink)}
        className="mt-5 text-[14px] font-semibold text-pine underline-offset-4 hover:underline"
      >
        {useLink ? "Log in with an invite code" : "Email me a sign-in link instead"}
      </button>
    </>
  );
}

function CodeForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginWithInviteCode, CODE_START);
  const error = state.status === "error" ? state.message : null;
  return (
    <form action={action} className="mt-8 flex flex-col gap-3 text-left" noValidate>
      <input type="hidden" name="next" value={next} />
      <label htmlFor="code-email" className="text-[15px] font-bold">
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
      <label htmlFor="code" className="mt-2 text-[15px] font-bold">
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
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}

function LinkForm({ next, expired }: { next: string; expired: boolean }) {
  const [state, action, pending] = useActionState(sendLoginLink, START);

  if (state.status === "sent") {
    return (
      <div className="mt-8 text-left" role="status">
        <p className="text-lg font-bold">Check your email</p>
        <p className="mt-2 text-[15px] leading-relaxed text-graphite">
          We sent a sign-in link to <span className="font-bold text-ink">{state.email}</span>. Open it on this device
          to continue. It can take a minute to arrive; check spam if you don’t see it.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-3 text-left" noValidate>
      <input type="hidden" name="next" value={next} />
      {expired && state.status === "idle" ? (
        <p className="rounded-choice bg-pine-tint px-4 py-3 text-sm font-semibold text-ink" role="status">
          That sign-in link has expired or was already used. Enter your email for a new one.
        </p>
      ) : null}
      <label htmlFor="email" className="text-[15px] font-bold">
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
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
        {pending ? "Sending link…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
