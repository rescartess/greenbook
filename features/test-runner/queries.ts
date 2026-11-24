import "server-only";
import { createDbClient } from "@/core/db/server";
import { isUuid } from "./ids";
import { parseTestState, type TestState } from "./schema";

/** The running test for the signed-in student, or null if it isn't theirs or doesn't exist. */
export async function getTestState(attemptId: string): Promise<TestState | null> {
  if (!isUuid(attemptId)) return null;
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("get_test_state", { p_attempt_id: attemptId });
  if (error) {
    if (error.code === "42501") return null;
    throw new Error(`The test could not be loaded: ${error.message}`);
  }
  return parseTestState(data);
}
