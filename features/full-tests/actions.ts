"use server";

import { redirect } from "next/navigation";
import { createDbClient } from "@/core/db/server";

export type StartState = { message: string | null };

/** Starts (or resumes) a full test and opens the test screen. */
export async function startTest(setId: string, _prev: StartState, _form: FormData): Promise<StartState> {
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("start_full_test", { p_set_id: setId });
  if (error || !data) {
    return { message: error?.code === "42501" ? "Sign in again to start the test." : "This test can’t be started right now. Try again in a minute." };
  }
  redirect(`/test/${data}`);
}
