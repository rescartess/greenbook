"use server";

import { redirect } from "next/navigation";
import { createDbClient } from "@/core/db/server";
import { nextSectionAfter } from "./queries";
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

/** "Save and exit": stops this module's clock. Opening the test again restarts it. */
export async function pauseTest(attemptModuleId: string): Promise<{ ok: boolean }> {
  const supabase = await createDbClient();
  const { error } = await supabase.rpc("pause_test", { p_attempt_module_id: attemptModuleId });
  return { ok: !error };
}

/** "Delete and exit": throws this attempt away. It won't count anywhere. */
export async function abandonTest(attemptId: string): Promise<{ ok: boolean }> {
  const supabase = await createDbClient();
  const { error } = await supabase.rpc("abandon_test", { p_attempt_id: attemptId });
  return { ok: !error };
}

/**
 * "Resume Testing" on the break page: starts (or reopens) the same month's Math adaptive test.
 * The Math test is looked up again here, so the browser can't pick a different one.
 */
export async function startNextSection(englishAttemptId: string): Promise<{ message: string }> {
  const next = await nextSectionAfter(englishAttemptId);
  if (!next) return { message: "There’s no Math section for this test." };
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("start_full_test", { p_set_id: next.mathSetId });
  if (error || !data) {
    return { message: error?.code === "42501" ? "Sign in again to keep going." : "The Math section couldn’t start. Check your connection and try again." };
  }
  redirect(`/test/${data}`);
}
