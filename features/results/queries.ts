import "server-only";
import { createDbClient } from "@/core/db/server";
import type { SubjectSlug } from "@/core/config/subjects";
import { parseAttempts, parseResults, type AttemptSummary, type TestResults } from "./schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


/** One finished test with every question, answer and explanation. Null if it isn't the student's. */
export async function getResults(attemptId: string): Promise<TestResults | null> {
  if (!UUID.test(attemptId)) return null;
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("get_test_results", { p_attempt_id: attemptId });
  if (error) {
    if (error.code === "42501" || error.code === "P0006") return null;
    throw new Error(`Could not load the results: ${error.message}`);
  }
  return parseResults(data);
}

/** Every finished or unfinished test and practice of the signed-in student in one subject, newest first. */
export async function listAttempts(subject: SubjectSlug): Promise<AttemptSummary[]> {
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("list_my_attempts", { p_subject: subject });
  if (error) throw new Error(`Could not load results: ${error.message}`);
  return parseAttempts(data);
}
