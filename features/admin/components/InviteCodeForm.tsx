"use client";

import { useActionState } from "react";
import { Button } from "@/core/design/ui";
import { setInviteCode, type InviteCodeState } from "../actions";

const START: InviteCodeState = { message: null, saved: false };

/** Admin box for the one invite code every student logs in with. */
export function InviteCodeForm({ code }: { code: string | null }) {
  const [state, action, pending] = useActionState(setInviteCode, START);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-56 flex-1 flex-col gap-1.5">
        <label htmlFor="invite-code" className="text-[15px] font-bold">
          Invite code
        </label>
        <input
          id="invite-code"
          name="code"
          defaultValue={code ?? ""}
          autoComplete="off"
          spellCheck={false}
          placeholder="Empty means off"
          className="h-11 rounded-choice border-[1.5px] border-control bg-paper px-4 text-base uppercase text-ink placeholder:normal-case placeholder:text-graphite focus:border-pine focus:outline-none"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save code"}
      </Button>
      {state.message ? (
        <p className="w-full text-sm font-semibold text-ink" role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
