"use client";

import { useState, useTransition } from "react";
import { Button } from "@/core/design/ui";
import { removeAttempt } from "../actions";

/** "Delete this attempt", with a second step so it isn't pressed by accident. */
export function DeleteAttemptButton({ attemptId, subject }: { attemptId: string; subject: string }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!confirming) {
    return (
      <Button variant="quiet" size="sm" onClick={() => setConfirming(true)}>
        Delete this attempt
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[14px] font-semibold">Delete it from your results?</span>
      <Button variant="quiet" size="sm" disabled={pending} onClick={() => setConfirming(false)}>
        Keep it
      </Button>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await removeAttempt(attemptId, subject);
            if (result?.message) setMessage(result.message);
          })
        }
      >
        {pending ? "Deleting…" : "Delete"}
      </Button>
      {message ? <span className="text-[14px] text-incorrect">{message}</span> : null}
    </div>
  );
}
