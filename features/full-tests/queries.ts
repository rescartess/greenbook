import "server-only";
import { createDbClient } from "@/core/db/server";
import type { SubjectSlug } from "@/core/config/subjects";

export type PartSize = { questions: number; minutes: number };

export type FullTestRow = {
  id: string;
  title: string;
  published: boolean;
  /** Module 1 routes to an easier or harder Module 2 (both exist). Otherwise Module 2 is fixed. */
  adaptive: boolean;
  /** First day of the month the test is named after, e.g. "2025-09-01". */
  month: string | null;
  questions: number;
  minutes: number;
  /** "Module 1", "Module 2 Hard"... in order, for the test card. */
  moduleNames: string[];
  /** Questions and minutes of Module 1 and of each Module 2, for "Module 1 only" / "Module 2 only". */
  parts: { module1: PartSize | null; harder: PartSize | null; easier: PartSize | null };
  inProgressId: string | null;
  last: { attemptId: string; score: number | null; raw: number | null; finishedAt: string } | null;
};

/** Full tests the student can take (admins also see drafts), with their own progress on each. */
export async function listFullTests(subject: SubjectSlug): Promise<FullTestRow[]> {
  const supabase = await createDbClient();
  const [{ data: sets, error }, { data: claims }] = await Promise.all([
    supabase
      .from("question_sets")
      .select("id, title, published, is_adaptive, month, created_at, modules(module_number, tier, sort_order, time_limit_sec, module_questions(count))")
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
        .select("id, set_id, status, part, scaled_score, raw_correct, finished_at")
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
    // "Last score" is the last full test; a single module has no 200–800 score.
    const done = mine.find((a) => a.status === "completed" && a.finished_at && a.part === "full");
    const size = (m: (typeof set.modules)[number] | undefined): PartSize | null =>
      m ? { questions: m.module_questions[0]?.count ?? 0, minutes: Math.round((m.time_limit_sec ?? 0) / 60) } : null;
    const second = (tier: string) =>
      [...set.modules].filter((m) => m.module_number === 2).sort((a, b) => Number(b.tier === tier) - Number(a.tier === tier) || Number(b.tier === "standard") - Number(a.tier === "standard") || a.sort_order - b.sort_order)[0];
    const tiers = new Set(set.modules.filter((m) => m.module_number === 2).map((m) => m.tier));
    return {
      id: set.id,
      title: set.title,
      published: set.published,
      adaptive: set.is_adaptive && tiers.has("easier") && tiers.has("harder"),
      month: set.month,
      moduleNames: [...set.modules]
        .sort((a, b) => a.module_number - b.module_number || a.sort_order - b.sort_order)
        .map((m) => `Module ${m.module_number}${m.module_number === 2 && m.tier !== "standard" ? (m.tier === "harder" ? " Hard" : " Easy") : ""}`),
      parts: {
        module1: size(firstOf(1)),
        harder: size(second("harder")),
        easier: tiers.has("easier") && tiers.has("harder") ? size(second("easier")) : null,
      },
      questions: taken.reduce((sum, m) => sum + (m?.module_questions[0]?.count ?? 0), 0),
      minutes: Math.round(taken.reduce((sum, m) => sum + (m?.time_limit_sec ?? 0), 0) / 60),
      inProgressId: mine.find((a) => a.status === "in_progress")?.id ?? null,
      last: done ? { attemptId: done.id, score: done.scaled_score, raw: done.raw_correct, finishedAt: done.finished_at! } : null,
    };
  });
}
