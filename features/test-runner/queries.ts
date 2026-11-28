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

export type NextSection = {
  /** The same month's Math adaptive test. */
  mathSetId: string;
  /** The English attempt's status and when it ended (the break runs 10 minutes from then). */
  status: string;
  finishedAt: string | null;
};

/**
 * For an English adaptive full test: the same month's Math adaptive test, so the student gets a
 * break and then goes straight on to Math, like the real SAT. Null for anything else.
 */
export async function nextSectionAfter(attemptId: string): Promise<NextSection | null> {
  if (!isUuid(attemptId)) return null;
  const supabase = await createDbClient();
  const { data: attempt } = await supabase
    .from("attempts")
    .select("set_id, subject, status, finished_at, part")
    .eq("id", attemptId)
    .maybeSingle();
  // Only after the whole English test, not after one module taken alone.
  if (!attempt?.set_id || attempt.subject !== "english" || attempt.part !== "full") return null;
  const { data: set } = await supabase
    .from("question_sets")
    .select("kind, is_adaptive, month")
    .eq("id", attempt.set_id)
    .maybeSingle();
  if (!set || set.kind !== "full_test" || !set.is_adaptive || !set.month) return null;
  // Students only see published tests (database rules); the admin also sees drafts.
  const { data: math } = await supabase
    .from("question_sets")
    .select("id")
    .eq("kind", "full_test")
    .eq("subject", "math")
    .eq("is_adaptive", true)
    .eq("month", set.month)
    .order("published", { ascending: false })
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!math) return null;
  return { mathSetId: math.id, status: attempt.status, finishedAt: attempt.finished_at };
}
