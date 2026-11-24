"use client";

import { useActionState } from "react";
import { Button } from "@/core/design/ui";
import { startTest, type StartState } from "../actions";

export function StartTestButton({ setId, label, variant = "primary" }: { setId: string; label: string; variant?: "primary" | "quiet" }) {
  const [state, action, pending] = useActionState(startTest.bind(null, setId), { message: null } as StartState);
  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <Button type="submit" variant={variant} disabled={pending}>
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
