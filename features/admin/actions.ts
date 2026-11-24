"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDbClient } from "@/core/db/server";
import { requireAdmin } from "@/features/auth";
import {
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
        "is_adaptive, modules(module_number, tier, module_questions(question_id, questions(question_answers(correct_answer))))",
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
