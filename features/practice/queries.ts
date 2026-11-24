import "server-only";
import type { SubjectSlug } from "@/core/config/subjects";
import { createDbClient } from "@/core/db/server";
import { parsePracticeState, type PracticeState } from "./schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PracticeSetRow = {
  id: string;
  title: string;
  published: boolean;
  skill: string | null;
  area: string | null;
  areaOrder: number;
  skillOrder: number;
  month: string | null;
  questions: number;
  inProgressId: string | null;
  last: { correct: number | null; finishedAt: string | null } | null;
};

/** Published topic or monthly sets (admins also see drafts) with the student's own progress. */
export async function listPracticeSets(subject: SubjectSlug, kind: "topic" | "monthly"): Promise<PracticeSetRow[]> {
  const supabase = await createDbClient();
  const [{ data: sets, error }, { data: claims }] = await Promise.all([
    supabase
      .from("question_sets")
      .select("id, title, published, month, created_at, skills(name, sort_order, domains(name, sort_order)), modules(module_questions(count))")
      .eq("kind", kind)
      .eq("subject", subject)
      .order("created_at"),
    supabase.auth.getClaims(),
  ]);
  if (error) throw new Error(`Could not load practice sets: ${error.message}`);
  const userId = claims?.claims?.sub;
  const { data: attempts } = userId
    ? await supabase
        .from("attempts")
        .select("id, set_id, status, raw_correct, finished_at")
        .eq("user_id", userId)
        .eq("mode", "practice")
        .order("started_at", { ascending: false })
    : { data: [] };

  return sets.map((s) => {
    const mine = (attempts ?? []).filter((a) => a.set_id === s.id);
    const done = mine.find((a) => a.status === "completed");
    return {
      id: s.id,
      title: s.title,
      published: s.published,
      skill: s.skills?.name ?? null,
      area: s.skills?.domains?.name ?? null,
      areaOrder: s.skills?.domains?.sort_order ?? 99,
      skillOrder: s.skills?.sort_order ?? 99,
      month: s.month,
      questions: s.modules.reduce((sum, m) => sum + (m.module_questions[0]?.count ?? 0), 0),
      inProgressId: mine.find((a) => a.status === "in_progress")?.id ?? null,
      last: done ? { correct: done.raw_correct, finishedAt: done.finished_at } : null,
    };
  });
}

export async function getPracticeState(attemptId: string): Promise<PracticeState | null> {
  if (!UUID.test(attemptId)) return null;
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("get_practice_state", { p_attempt_id: attemptId });
  if (error) {
    if (error.code === "42501") return null;
    throw new Error(`The practice could not be loaded: ${error.message}`);
  }
  return parsePracticeState(data);
}
