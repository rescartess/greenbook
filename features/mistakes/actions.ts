"use server";

import { createDbClient } from "@/core/db/server";
import { parseRetry, type RetryFeedback } from "./schema";

export async function retryMistake(questionId: string, answer: string): Promise<RetryFeedback> {
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("retry_mistake", { p_question_id: questionId, p_answer: answer });
  if (error) throw new Error(error.code === "22023" ? "Pick an answer first." : "That didn’t save. Check your connection and try again.");
  return parseRetry(data);
}
