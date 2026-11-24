"use server";

import { redirect } from "next/navigation";
import type { CheckFeedback } from "@/core/question";
import { createDbClient } from "@/core/db/server";
import { parseFeedback } from "./schema";

export type StartState = { message: string | null };

export async function startPractice(setId: string, _prev: StartState, _form: FormData): Promise<StartState> {
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("start_practice", { p_set_id: setId });
  if (error || !data) return { message: "This practice can’t be started right now. Try again in a minute." };
  redirect(`/practice/${data}`);
}

export async function checkPracticeAnswer(attemptModuleId: string, questionId: string, answer: string): Promise<CheckFeedback> {
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("check_practice_answer", {
    p_attempt_module_id: attemptModuleId,
    p_question_id: questionId,
    p_answer: answer,
  });
  const feedback = parseFeedback(data);
  if (error || !feedback) {
    throw new Error(error?.code === "P0003" ? "This practice is already finished." : "That didn’t save. Check your connection and try again.");
  }
  return feedback;
}

export async function finishPractice(attemptId: string): Promise<void> {
  const supabase = await createDbClient();
  const { error } = await supabase.rpc("finish_practice", { p_attempt_id: attemptId });
  if (error) throw new Error("The practice couldn’t be finished. Try again.");
}
