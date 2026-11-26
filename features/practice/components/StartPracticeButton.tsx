"use client";

import { useActionState } from "react";
import { Btn } from "@/core/shell";
import { startPractice, type StartState } from "../actions";

export function StartPracticeButton({ setId, label, variant = "primary" }: { setId: string; label: string; variant?: "primary" | "quiet" }) {
  const [state, action, pending] = useActionState(startPractice.bind(null, setId), { message: null } as StartState);
  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <Btn type="submit" tone={variant} disabled={pending}>
        {pending ? "Opening…" : label}
      </Btn>
      {state.message ? (
        <span role="alert" className="text-sm font-semibold">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
