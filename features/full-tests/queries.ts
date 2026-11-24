import "server-only";
import { createDbClient } from "@/core/db/server";
import type { SubjectSlug } from "@/core/config/subjects";

export type FullTestRow = {
  id: string;
  title: string;
  published: boolean;
  questions: number;
  minutes: number;
  inProgressId: string | null;
  last: { attemptId: string; score: number | null; raw: number | null; finishedAt: string } | null;
};

/** Full tests the student can take (admins also see drafts), with their own progress on each. */
export async function listFullTests(subject: SubjectSlug): Promise<FullTestRow[]> {
  const supabase = await createDbClient();
  const [{ data: sets, error }, { data: claims }] = await Promise.all([
    supabase
      .from("question_sets")
      .select("id, title, published, created_at, modules(module_number, sort_order, time_limit_sec, module_questions(count))")
      .eq("kind", "full_test")
      .eq("subject", subject)
      .order("created_at"),
    supabase.auth.getClaims(),
  ]);
  if (error) throw new Error(`Could not load tests: ${error.message}`);
  const userId = claims?.claims?.sub;

  const { data: attempts } = userId
    ? await supabase
        .from("attempts")
        .select("id, set_id, status, scaled_score, raw_correct, finished_at")
        .eq("user_id", userId)
        .eq("subject", subject)
        .order("started_at", { ascending: false })
    : { data: [] };

  return sets.map((set) => {
    // A full test is module 1 plus one module 2, so count module 1 and the first module 2.
    const firstOf = (n: number) =>
      [...set.modules].filter((m) => m.module_number === n).sort((a, b) => a.sort_order - b.sort_order)[0];
    const taken = [firstOf(1), firstOf(2)].filter(Boolean);
    const mine = (attempts ?? []).filter((a) => a.set_id === set.id);
    const done = mine.find((a) => a.status === "completed" && a.finished_at);
    return {
      id: set.id,
      title: set.title,
      published: set.published,
      questions: taken.reduce((sum, m) => sum + (m?.module_questions[0]?.count ?? 0), 0),
      minutes: Math.round(taken.reduce((sum, m) => sum + (m?.time_limit_sec ?? 0), 0) / 60),
      inProgressId: mine.find((a) => a.status === "in_progress")?.id ?? null,
      last: done ? { attemptId: done.id, score: done.scaled_score, raw: done.raw_correct, finishedAt: done.finished_at! } : null,
    };
  });
}
