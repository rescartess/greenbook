"use client";

import { useActionState } from "react";
import { Button } from "@/core/design/ui";
import { startPractice, type StartState } from "../actions";

export function StartPracticeButton({ setId, label, variant = "primary" }: { setId: string; label: string; variant?: "primary" | "quiet" }) {
  const [state, action, pending] = useActionState(startPractice.bind(null, setId), { message: null } as StartState);
  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? "Opening…" : label}
      </Button>
      {state.message ? (
        <span role="alert" className="text-sm font-semibold">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
