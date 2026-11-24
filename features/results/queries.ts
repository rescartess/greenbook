import "server-only";
import { createDbClient } from "@/core/db/server";
import type { SubjectSlug } from "@/core/config/subjects";
import { parseResults, type TestResults } from "./schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ResultRow = { attemptId: string; title: string; finishedAt: string; score: number | null; raw: number | null };

/** The signed-in student's finished tests in one subject, newest first. */
export async function listResults(subject: SubjectSlug): Promise<ResultRow[]> {
  const supabase = await createDbClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("attempts")
    .select("id, finished_at, scaled_score, raw_correct, question_sets(title)")
    .eq("user_id", userId)
    .eq("subject", subject)
    .eq("status", "completed")
    .order("finished_at", { ascending: false });
  if (error) throw new Error(`Could not load results: ${error.message}`);
  return data.map((a) => ({
    attemptId: a.id,
    title: a.question_sets?.title ?? "Test",
    finishedAt: a.finished_at ?? "",
    score: a.scaled_score,
    raw: a.raw_correct,
  }));
}

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
