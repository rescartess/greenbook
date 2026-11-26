"use client";

import { useState, useTransition } from "react";
import { Btn } from "@/core/shell";
import { removeAttempt } from "../actions";

/** "Delete this attempt", with a second step so it isn't pressed by accident. */
export function DeleteAttemptButton({ attemptId, subject }: { attemptId: string; subject: string }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!confirming) {
    return (
      <Btn tone="quiet" className="h-9 px-3.5 text-[14px]" onClick={() => setConfirming(true)}>
        Delete this attempt
      </Btn>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[14px] font-semibold">Delete it from your results?</span>
      <Btn tone="quiet" className="h-9 px-3.5 text-[14px]" disabled={pending} onClick={() => setConfirming(false)}>
        Keep it
      </Btn>
      <Btn
        className="h-9 px-3.5 text-[14px]"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await removeAttempt(attemptId, subject);
            if (result?.message) setMessage(result.message);
          })
        }
      >
        {pending ? "Deleting…" : "Delete"}
      </Btn>
      {message ? <span className="text-[14px] text-incorrect">{message}</span> : null}
    </div>
  );
}
