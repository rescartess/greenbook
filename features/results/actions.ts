"use server";

import { redirect } from "next/navigation";
import { isSubjectSlug } from "@/core/config/subjects";
import { createDbClient } from "@/core/db/server";

/** "Delete this attempt": the finished test leaves results, the dashboard and the score trend. */
export async function removeAttempt(attemptId: string, subject: string): Promise<{ message: string }> {
  const supabase = await createDbClient();
  const { error } = await supabase.rpc("remove_attempt", { p_attempt_id: attemptId });
  if (error) return { message: "This attempt couldn’t be deleted. Try again." };
  redirect(`/${isSubjectSlug(subject) ? subject : "english"}/results`);
}

/**
 * "Retake": starts the same thing again. A full test (or the same single module) or monthly set starts over; a topic practice
 * starts the same level, range, checking and timer, under the same name.
 */
export async function retakeAttempt(attemptId: string, _prev: { message: string | null }, _form: FormData): Promise<{ message: string | null }> {
  const supabase = await createDbClient();
  const { data: a } = await supabase
    .from("attempts")
    .select("set_id, check_mode, options, name, part, question_sets(kind), attempt_modules(modules(tier))")
    .eq("id", attemptId)
    .maybeSingle();
  if (!a?.set_id) return { message: "This can’t be started again. Open it from Topics or Full tests." };
  const kind = a.question_sets?.kind;
  const o = (a.options && typeof a.options === "object" && !Array.isArray(a.options) ? a.options : {}) as Record<string, unknown>;

  let started: { data: string | null; error: unknown };
  if (kind === "full_test") {
    // The same part again: the whole test, Module 1 only, or the same Module 2 (hard or easy).
    const tier = a.attempt_modules?.[0]?.modules?.tier === "easier" ? "easier" : "harder";
    started = await supabase.rpc("start_test_part", { p_set_id: a.set_id, p_part: a.part, p_tier: a.part === "module2" ? tier : null });
  }
  else if (kind === "monthly") started = await supabase.rpc("start_practice", { p_set_id: a.set_id });
  else {
    const from = typeof o.from === "number" ? o.from : 1;
    const to = typeof o.to === "number" ? o.to : from;
    started = await supabase.rpc("start_topic_practice", {
      p_set_id: a.set_id,
      p_difficulty: typeof o.difficulty === "string" ? o.difficulty : "all",
      p_from: from,
      p_count: to - from + 1,
      p_check_mode: a.check_mode === "end" ? "end" : "each",
      p_minutes: typeof o.minutes === "number" ? o.minutes : null,
      p_name: a.name ?? "",
    });
  }
  if (started.error || !started.data) return { message: "This can’t be started again right now. Try again in a minute." };
  redirect(kind === "full_test" ? `/test/${started.data}` : `/practice/${started.data}`);
}
