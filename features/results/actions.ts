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
