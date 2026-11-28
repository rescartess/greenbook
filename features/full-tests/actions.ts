"use server";

import { redirect } from "next/navigation";
import { createDbClient } from "@/core/db/server";

export type StartState = { message: string | null };

const PARTS = new Set(["full", "module1", "module2"]);

/**
 * Starts (or resumes) a full test and opens the test screen. The form says which part:
 * "full", "module1" or "module2", and for Module 2 of an adaptive test "harder" or "easier".
 */
export async function startTest(setId: string, _prev: StartState, form: FormData): Promise<StartState> {
  const part = String(form.get("part") ?? "full");
  const tier = form.get("tier") === "easier" ? "easier" : "harder";
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("start_test_part", {
    p_set_id: setId,
    p_part: PARTS.has(part) ? part : "full",
    p_tier: part === "module2" ? tier : null,
  });
  if (error || !data) {
    return { message: error?.code === "42501" ? "Sign in again to start the test." : "This test can’t be started right now. Try again in a minute." };
  }
  redirect(`/test/${data}`);
}
