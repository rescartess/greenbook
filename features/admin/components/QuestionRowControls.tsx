"use client";

import { useState, useTransition } from "react";
import { moveInModule, removeFromModule } from "../actions";

/** Move up / move down / take out of the module, next to each question in a test. */
export function QuestionRowControls({ moduleId, questionId, first, last }: { moduleId: string; questionId: string; first: boolean; last: boolean }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const btn = "rounded-[6px] px-2.5 py-1 text-[13px] font-semibold text-ink-soft hover:bg-mist disabled:opacity-40";

  if (confirm) {
    return (
      <span className="flex items-center gap-1.5">
        <button type="button" className={btn} onClick={() => setConfirm(false)} disabled={pending}>
          Keep
        </button>
        <button
          type="button"
          className="rounded-[6px] bg-ink px-2.5 py-1 text-[13px] font-semibold text-paper"
          disabled={pending}
          onClick={() => start(() => removeFromModule(moduleId, questionId))}
        >
          {pending ? "Removing…" : "Take out"}
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-0.5">
      <button type="button" className={btn} disabled={first || pending} aria-label="Move up" onClick={() => start(() => moveInModule(moduleId, questionId, -1))}>
        Up
      </button>
      <button type="button" className={btn} disabled={last || pending} aria-label="Move down" onClick={() => start(() => moveInModule(moduleId, questionId, 1))}>
        Down
      </button>
      <button type="button" className={btn} disabled={pending} onClick={() => setConfirm(true)}>
        Take out
      </button>
    </span>
  );
}
