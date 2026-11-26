"use server";

import { redirect } from "next/navigation";
import type { CheckFeedback } from "@/core/question";
import { createDbClient } from "@/core/db/server";
import { isDifficulty, parseFeedback, practiceErrorMessage } from "./schema";

export type StartState = { message: string | null };

/** Starts (or resumes) a whole monthly set, checked as you go. */
export async function startPractice(setId: string, _prev: StartState, _form: FormData): Promise<StartState> {
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("start_practice", { p_set_id: setId });
  if (error || !data) return { message: "This practice can’t be started right now. Try again in a minute." };
  redirect(`/practice/${data}`);
}

/**
 * Starts a range of a topic: form fields setId, difficulty, from, count, checkMode ("each" | "end"),
 * minutes (empty for no timer) and name (the student's name for this practice, shown in Results).
 */
export async function startTopicPractice(_prev: StartState, form: FormData): Promise<StartState> {
  const setId = String(form.get("setId") ?? "");
  const difficulty = String(form.get("difficulty") ?? "");
  const from = Number(form.get("from"));
  const count = Number(form.get("count"));
  const checkMode = form.get("checkMode") === "end" ? "end" : "each";
  const minutesRaw = String(form.get("minutes") ?? "").trim();
  const minutes = minutesRaw === "" ? null : Number(minutesRaw);
  const name = String(form.get("name") ?? "").replace(/\s+/g, " ").trim();

  if (!isDifficulty(difficulty)) return { message: "Pick a difficulty." };
  if (!Number.isInteger(from) || from < 1) return { message: "Pick where to start." };
  if (!Number.isInteger(count) || count < 1 || count > 600) return { message: "Pick between 1 and 600 questions." };
  if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 300))
    return { message: "Set the timer between 1 and 300 minutes." };
  if (!name) return { message: "Give this practice a name." };
  if (name.length > 60) return { message: "Use 60 characters or fewer for the name." };

  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("start_topic_practice", {
    p_set_id: setId,
    p_difficulty: difficulty,
    p_from: from,
    p_count: count,
    p_check_mode: checkMode,
    p_minutes: minutes,
    p_name: name,
  });
  if (error || !data) {
    return {
      message:
        error?.code === "P0002"
          ? "There are no questions in that range. Pick another one."
          : "This practice can’t be started right now. Try again in a minute.",
    };
  }
  redirect(`/practice/${data}`);
}

export type SaveResult = { ok: true } | { ok: false; message: string; reload: boolean };

/** Saves a pick, a mark for review or crossed-out choices, without grading. */
export async function savePracticeResponse(input: {
  attemptModuleId: string;
  questionId: string;
  answer: string | null;
  marked: boolean;
  eliminated: string[];
}): Promise<SaveResult> {
  const supabase = await createDbClient();
  const { error } = await supabase.rpc("save_practice_response", {
    p_attempt_module_id: input.attemptModuleId,
    p_question_id: input.questionId,
    p_answer: input.answer,
    p_marked: input.marked,
    p_eliminated: input.eliminated,
  });
  if (error) return { ok: false, ...practiceErrorMessage(error.code) };
  return { ok: true };
}

export type CheckResult = { ok: true; feedback: CheckFeedback } | { ok: false; message: string; reload: boolean };

/** Grades one question (check-as-you-go practices only). The answer is final afterwards. */
export async function checkPracticeAnswer(
  attemptModuleId: string,
  questionId: string,
  answer: string,
): Promise<CheckResult> {
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("check_practice_answer", {
    p_attempt_module_id: attemptModuleId,
    p_question_id: questionId,
    p_answer: answer,
  });
  const feedback = parseFeedback(data);
  if (error || !feedback) return { ok: false, ...practiceErrorMessage(error?.code) };
  return { ok: true, feedback };
}

/** Ends a practice: grades whatever wasn't checked yet. */
export async function finishPractice(attemptId: string): Promise<{ ok: boolean }> {
  const supabase = await createDbClient();
  const { error } = await supabase.rpc("finish_practice", { p_attempt_id: attemptId });
  return { ok: !error };
}

/** Leaves a timed practice: the clock stops until the student opens it again. */
export async function pausePractice(attemptModuleId: string): Promise<{ ok: boolean }> {
  const supabase = await createDbClient();
  const { error } = await supabase.rpc("pause_test", { p_attempt_module_id: attemptModuleId });
  return { ok: !error };
}

/** Throws a practice away; it won't count anywhere. */
export async function abandonPractice(attemptId: string): Promise<{ ok: boolean }> {
  const supabase = await createDbClient();
  const { error } = await supabase.rpc("abandon_test", { p_attempt_id: attemptId });
  return { ok: !error };
}
