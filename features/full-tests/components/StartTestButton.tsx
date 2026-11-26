"use client";

import { useActionState } from "react";
import { Btn } from "@/core/shell";
import { startTest, type StartState } from "../actions";

/** Starts the test (or opens the one already running, where the student left off). */
export function StartTestButton({ setId, label = "Start test" }: { setId: string; label?: string }) {
  const [state, action, pending] = useActionState(startTest.bind(null, setId), { message: null } as StartState);
  return (
    <form action={action} className="flex flex-col gap-1.5">
      <Btn type="submit" disabled={pending} className="w-full">
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
