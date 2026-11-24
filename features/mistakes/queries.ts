import "server-only";
import type { SubjectSlug } from "@/core/config/subjects";
import { createDbClient } from "@/core/db/server";
import { parseMistakes, type Mistake } from "./schema";

/** How many questions each subject has waiting in Mistakes (the badge on the tab). */
export async function getMistakeCounts(): Promise<Record<SubjectSlug, number>> {
  const supabase = await createDbClient();
  const { data } = await supabase
    .from("question_progress")
    .select("question_id, questions!inner(subject, status)")
    .gt("times_wrong", 0)
    .eq("mastered", false)
    .neq("questions.status", "retired");
  const counts: Record<SubjectSlug, number> = { english: 0, math: 0 };
  for (const row of data ?? []) {
    const subject = row.questions?.subject;
    if (subject === "english" || subject === "math") counts[subject] += 1;
  }
  return counts;
}

export async function getMistakes(subject: SubjectSlug): Promise<Mistake[]> {
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("get_mistakes", { p_subject: subject });
  if (error) throw new Error(`Could not load your mistakes: ${error.message}`);
  return parseMistakes(data);
}
