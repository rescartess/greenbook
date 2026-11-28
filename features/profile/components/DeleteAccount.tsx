"use client";

import { useState, useTransition } from "react";
import { Btn } from "@/core/shell";
import { deleteAccount } from "../actions";

/** "Delete my account": asks once more, then removes the account and everything in it. */
export function DeleteAccount() {
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!asking)
    return (
      <Btn tone="quiet" className="mt-3" onClick={() => setAsking(true)}>
        Delete my account
      </Btn>
    );

  return (
    <div className="mt-4 rounded-[10px] border border-incorrect/40 bg-incorrect-tint p-4">
      <p className="text-[15px] font-semibold">Delete your account for good?</p>
      <p className="mt-1 text-[14px] text-ink-soft">Your scores, answers, mistakes and photo go too. This can’t be undone.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn
          disabled={pending}
          className="bg-incorrect text-paper hover:bg-incorrect"
          onClick={() =>
            start(async () => {
              const r = await deleteAccount();
              if (r && !r.ok) setMessage(r.message);
            })
          }
        >
          {pending ? "Deleting…" : "Delete for good"}
        </Btn>
        <Btn tone="quiet" disabled={pending} onClick={() => setAsking(false)}>
          Keep my account
        </Btn>
      </div>
      {message && (
        <p role="alert" className="mt-2 text-[14px] font-semibold text-incorrect">
          {message}
        </p>
      )}
    </div>
  );
}
