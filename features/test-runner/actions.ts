"use server";

import { createDbClient } from "@/core/db/server";
import { saveErrorMessage } from "./schema";

export type SaveResult = { ok: true } | { ok: false; message: string; reload: boolean };

/** Saves one answer, mark or crossed-out list. The database checks the owner and the clock. */
export async function saveAnswer(input: {
  attemptModuleId: string;
  questionId: string;
  answer: string | null;
  marked: boolean;
  eliminated: string[];
  seconds: number;
}): Promise<SaveResult> {
  const supabase = await createDbClient();
  const { error } = await supabase.rpc("save_response", {
    p_attempt_module_id: input.attemptModuleId,
    p_question_id: input.questionId,
    p_answer: input.answer ?? "",
    p_marked: input.marked,
    p_eliminated: input.eliminated.slice(0, 6),
    p_seconds: Math.max(0, Math.min(600, Math.round(input.seconds))),
  });
  if (!error) return { ok: true };
  return { ok: false, ...saveErrorMessage(error.code) };
}

export type FinishResult = { ok: true; completed: boolean } | { ok: false; message: string };

/** Ends the current module. The database grades it and opens module 2 or finishes the test. */
export async function finishModule(attemptModuleId: string): Promise<FinishResult> {
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("finish_module", { p_attempt_module_id: attemptModuleId });
  if (error) return { ok: false, message: "The module couldn’t be finished. Check your connection and try again." };
  return { ok: true, completed: data === "completed" };
}
