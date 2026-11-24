"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDbClient } from "@/core/db/server";
import { requireAdmin } from "@/features/auth";
import {
  checkImport,
  isExternalId,
  isUuid,
  parseQuestionForm,
  publishProblems,
  type QuestionFormState,
} from "./schema";

/**
 * Saves the edit form for one question. Editing the passage, question or choices
 * raises the question's version (a database trigger), so earlier answers stay explainable.
 */
export async function saveQuestion(
  externalId: string,
  _prev: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  await requireAdmin();
  if (!isExternalId(externalId))
    return {
      status: "error",
      message: "This question doesn’t exist.",
      fields: {},
    };

  const parsed = parseQuestionForm(formData);
  if (!parsed.ok)
    return {
      status: "error",
      message: "Fix the marked fields, then save again.",
      fields: parsed.fields,
    };
  const input = parsed.value;

  const supabase = await createDbClient();
  const { data: question, error: findError } = await supabase
    .from("questions")
    .select("id, subject")
    .eq("external_id", externalId)
    .maybeSingle();
  if (findError || !question)
    return {
      status: "error",
      message: "This question doesn’t exist anymore.",
      fields: {},
    };

  const { data: skill } = await supabase
    .from("skills")
    .select("id, domains!inner(subject)")
    .eq("id", input.skillId)
    .eq("domains.subject", question.subject)
    .maybeSingle();
  if (!skill)
    return {
      status: "error",
      message: "Fix the marked fields, then save again.",
      fields: { skillId: "Pick a topic from this subject." },
    };

  const { error: updateError } = await supabase
    .from("questions")
    .update({
      passage: input.passage,
      prompt: input.prompt,
      choices: input.choices,
      skill_id: input.skillId,
      difficulty: input.difficulty,
      status: input.status,
    })
    .eq("id", question.id);
  if (updateError)
    return {
      status: "error",
      message: `Saving failed: ${updateError.message}`,
      fields: {},
    };

  const { error: answerError } = await supabase
    .from("question_answers")
    .upsert({
      question_id: question.id,
      correct_answer: input.correct,
      explanation: input.explanation,
    });
  if (answerError)
    return {
      status: "error",
      message: `The question was saved, but the answer wasn’t: ${answerError.message}`,
      fields: {},
    };

  revalidatePath("/admin", "layout");
  redirect(`/admin/questions/${externalId}`);
}

/**
 * Publishes or hides a test. Publishing also publishes its draft questions.
 * Refuses to publish a test that is missing a module or an answer.
 */
export async function setTestPublished(
  setId: string,
  publish: boolean,
): Promise<void> {
  await requireAdmin();
  if (!isUuid(setId)) throw new Error("This test doesn’t exist.");
  const supabase = await createDbClient();

  if (publish) {
    const { data: test, error } = await supabase
      .from("question_sets")
      .select(
        "kind, is_adaptive, modules(module_number, tier, module_questions(question_id, questions(question_answers(correct_answer))))",
      )
      .eq("id", setId)
      .single();
    if (error) throw new Error(`Could not load the test: ${error.message}`);

    const problems = publishProblems(
      test.is_adaptive,
      test.modules.map((m) => ({
        moduleNumber: m.module_number,
        tier: m.tier,
        questions: m.module_questions.length,
        withoutAnswer: m.module_questions.filter(
          (mq) => !mq.questions?.question_answers?.correct_answer,
        ).length,
      })),
      test.kind,
    );
    if (problems.length > 0)
      throw new Error(
        `This test can’t be published yet: ${problems.join(" ")}`,
      );

    const questionIds = test.modules.flatMap((m) =>
      m.module_questions.map((mq) => mq.question_id),
    );
    const { error: questionsError } = await supabase
      .from("questions")
      .update({ status: "published" })
      .in("id", questionIds)
      .eq("status", "draft");
    if (questionsError)
      throw new Error(
        `Publishing the questions failed: ${questionsError.message}`,
      );
  }

  const { error: setError } = await supabase
    .from("question_sets")
    .update({ published: publish })
    .eq("id", setId);
  if (setError) throw new Error(`Saving failed: ${setError.message}`);
  revalidatePath("/admin", "layout");
}

// ---- Creating tests and adding questions ----

export type SimpleState = { message: string | null };

export async function createTest(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  await requireAdmin();
  const kind = String(formData.get("kind") ?? "full_test");
  const title = String(formData.get("title") ?? "").trim();
  const subject = String(formData.get("subject") ?? "");
  const minutes = Number(formData.get("minutes"));
  const skillId = Number(formData.get(`skillId_${subject}`));
  const month = String(formData.get("month") ?? "");
  if (!title) return { message: "Give it a name." };
  if (subject !== "english" && subject !== "math") return { message: "Pick a subject." };

  const supabase = await createDbClient();
  let result;
  if (kind === "topic" || kind === "monthly") {
    if (kind === "topic" && !(skillId > 0)) return { message: "Pick the topic this set practises." };
    if (kind === "monthly" && !/^\d{4}-\d{2}$/.test(month)) return { message: "Pick the month." };
    result = await supabase.rpc("admin_create_set", {
      p_kind: kind,
      p_title: title,
      p_subject: subject,
      p_skill_id: kind === "topic" ? skillId : null,
      p_month: kind === "monthly" ? `${month}-01` : null,
    });
  } else {
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) return { message: "Minutes per module must be a whole number from 1 to 180." };
    result = await supabase.rpc("admin_create_test", { p_title: title, p_subject: subject, p_minutes: minutes });
  }
  const { data, error } = result;
  if (error || !data) return { message: `It couldn’t be created: ${error?.message ?? "unknown error"}` };
  revalidatePath("/admin", "layout");
  redirect(`/admin/tests/${data}`);
}

/** Adds the missing easier or harder module 2 to an adaptive test. */
export async function addModule(setId: string, tier: string): Promise<void> {
  await requireAdmin();
  if (!isUuid(setId) || (tier !== "easier" && tier !== "harder")) throw new Error("That module can’t be added.");
  const supabase = await createDbClient();
  const { data: first } = await supabase.from("modules").select("time_limit_sec").eq("set_id", setId).eq("module_number", 1).maybeSingle();
  const { error } = await supabase.from("modules").insert({
    set_id: setId,
    module_number: 2,
    tier,
    time_limit_sec: first?.time_limit_sec ?? null,
    sort_order: tier === "easier" ? 2 : 3,
  });
  if (error) throw new Error(`The module couldn’t be added: ${error.message}`);
  revalidatePath("/admin", "layout");
}

export async function addQuestion(moduleId: string, _prev: QuestionFormState, formData: FormData): Promise<QuestionFormState> {
  await requireAdmin();
  if (!isUuid(moduleId)) return { status: "error", message: "This module doesn’t exist.", fields: {} };
  const parsed = parseQuestionForm(formData);
  if (!parsed.ok) return { status: "error", message: "Fix the marked fields, then save again.", fields: parsed.fields };
  const v = parsed.value;

  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("admin_add_questions", {
    p_module_id: moduleId,
    p_items: [
      {
        passage: v.passage,
        prompt: v.prompt,
        choices: v.choices,
        answer: v.correct,
        explanation: v.explanation,
        skill_id: v.skillId,
        difficulty: v.difficulty,
      },
    ],
  });
  if (error || !data?.[0]) return { status: "error", message: `The question couldn’t be added: ${error?.message ?? "unknown error"}`, fields: {} };
  revalidatePath("/admin", "layout");
  redirect(`/admin/questions/${data[0]}`);
}

export type ImportState =
  | { step: "paste"; message: string | null; problems: string[] }
  | { step: "ready"; count: number; json: string }
  | { step: "done"; count: number; firstId: string };

/** Checks pasted questions first; imports them only when every one is fine and the admin confirms. */
export async function importQuestions(moduleId: string, _prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin();
  const text = String(formData.get("json") ?? "");
  const confirm = formData.get("confirm") === "yes";
  const supabase = await createDbClient();

  const { data: mod } = await supabase.from("modules").select("question_sets(subject)").eq("id", moduleId).maybeSingle();
  const subject = mod?.question_sets?.subject;
  if (!subject) return { step: "paste", message: "This module doesn’t exist.", problems: [] };

  const { data: skillRows } = await supabase.from("skills").select("id, name, slug, domains!inner(subject)").eq("domains.subject", subject);
  const result = checkImport(text, (skillRows ?? []).map((s) => ({ id: s.id, name: s.name, slug: s.slug })));
  if (result.problems.length > 0) return { step: "paste", message: "Nothing was imported. Fix these and check again:", problems: result.problems };
  if (!confirm) return { step: "ready", count: result.items.length, json: text };

  const { data, error } = await supabase.rpc("admin_add_questions", { p_module_id: moduleId, p_items: result.items });
  if (error || !data) return { step: "paste", message: `Nothing was imported: ${error?.message ?? "unknown error"}`, problems: [] };
  revalidatePath("/admin", "layout");
  return { step: "done", count: data.length, firstId: data[0] };
}

export async function removeFromModule(moduleId: string, questionId: string): Promise<void> {
  await requireAdmin();
  if (!isUuid(moduleId) || !isUuid(questionId)) return;
  const supabase = await createDbClient();
  const { error } = await supabase.rpc("admin_remove_from_module", { p_module_id: moduleId, p_question_id: questionId });
  if (error) throw new Error(`The question couldn’t be removed: ${error.message}`);
  revalidatePath("/admin", "layout");
}

export async function moveInModule(moduleId: string, questionId: string, direction: number): Promise<void> {
  await requireAdmin();
  if (!isUuid(moduleId) || !isUuid(questionId)) return;
  const supabase = await createDbClient();
  const { error } = await supabase.rpc("admin_move_in_module", { p_module_id: moduleId, p_question_id: questionId, p_direction: direction < 0 ? -1 : 1 });
  if (error) throw new Error(`The question couldn’t be moved: ${error.message}`);
  revalidatePath("/admin", "layout");
}
