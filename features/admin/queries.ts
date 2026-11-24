import "server-only";
import { parseChoices, toPlainText, type QuestionContent } from "@/core/question";
import { createDbClient } from "@/core/db/server";
import { isExternalId, isUuid, moduleLabel } from "./schema";

// Admin reads go through the admin's own login, so the database rules decide what they can see.

export type AdminTestSummary = {
  id: string;
  title: string;
  subject: string;
  published: boolean;
  modules: { label: string; count: number }[];
};

export async function listTests(): Promise<AdminTestSummary[]> {
  const supabase = await createDbClient();
  const { data, error } = await supabase
    .from("question_sets")
    .select("id, title, subject, published, modules(module_number, tier, sort_order, module_questions(count))")
    .order("created_at");
  if (error) throw new Error(`Could not load tests: ${error.message}`);

  return data.map((set) => ({
    id: set.id,
    title: set.title,
    subject: set.subject,
    published: set.published,
    modules: [...set.modules]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({ label: moduleLabel(m.module_number, m.tier), count: m.module_questions[0]?.count ?? 0 })),
  }));
}

export type AdminTestDetail = {
  id: string;
  title: string;
  subject: string;
  published: boolean;
  modules: {
    label: string;
    minutes: number | null;
    questions: { position: number; externalId: string; preview: string; skill: string; difficulty: string; answer: string }[];
  }[];
};

export async function getTest(setId: string): Promise<AdminTestDetail | null> {
  if (!isUuid(setId)) return null;
  const supabase = await createDbClient();
  const { data, error } = await supabase
    .from("question_sets")
    .select(
      "id, title, subject, published, modules(module_number, tier, sort_order, time_limit_sec, module_questions(position, questions(external_id, difficulty, passage, prompt, skills(name), question_answers(correct_answer))))",
    )
    .eq("id", setId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the test: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    subject: data.subject,
    published: data.published,
    modules: [...data.modules]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({
        label: moduleLabel(m.module_number, m.tier),
        minutes: m.time_limit_sec ? Math.round(m.time_limit_sec / 60) : null,
        questions: [...m.module_questions]
          .sort((a, b) => a.position - b.position)
          .flatMap((mq) => {
            const q = mq.questions;
            if (!q) return [];
            return [
              {
                position: mq.position,
                externalId: q.external_id,
                preview: toPlainText(q.passage || q.prompt),
                skill: q.skills?.name ?? "No topic",
                difficulty: q.difficulty,
                answer: q.question_answers?.correct_answer ?? "?",
              },
            ];
          }),
      })),
  };
}

export type AdminQuestionPreview = {
  externalId: string;
  content: QuestionContent;
  correctId: string | null;
  explanation: string | null;
  skill: string;
  domain: string;
  difficulty: string;
  status: string;
  version: number;
  place: {
    testId: string;
    testTitle: string;
    moduleLabel: string;
    position: number;
    total: number;
    previousId: string | null;
    nextId: string | null;
  } | null;
};

export async function getQuestionPreview(externalId: string): Promise<AdminQuestionPreview | null> {
  if (!isExternalId(externalId)) return null;
  const supabase = await createDbClient();
  const { data: q, error } = await supabase
    .from("questions")
    .select(
      "external_id, passage, prompt, choices, difficulty, status, version, skills(name, domains(name)), question_answers(correct_answer, explanation), module_questions(position, module_id, modules(module_number, tier, question_sets(id, title)))",
    )
    .eq("external_id", externalId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the question: ${error.message}`);
  if (!q) return null;

  let place: AdminQuestionPreview["place"] = null;
  const membership = q.module_questions[0];
  const set = membership?.modules?.question_sets;
  if (membership && membership.modules && set) {
    const { data: siblings, error: siblingsError } = await supabase
      .from("module_questions")
      .select("position, questions(external_id)")
      .eq("module_id", membership.module_id)
      .order("position");
    if (siblingsError) throw new Error(`Could not load the module: ${siblingsError.message}`);
    const idAt = (position: number) => siblings.find((s) => s.position === position)?.questions?.external_id ?? null;
    place = {
      testId: set.id,
      testTitle: set.title,
      moduleLabel: moduleLabel(membership.modules.module_number, membership.modules.tier),
      position: membership.position,
      total: siblings.length,
      previousId: idAt(membership.position - 1),
      nextId: idAt(membership.position + 1),
    };
  }

  return {
    externalId: q.external_id,
    content: { passage: q.passage, prompt: q.prompt, choices: parseChoices(q.choices) },
    correctId: q.question_answers?.correct_answer ?? null,
    explanation: q.question_answers?.explanation ?? null,
    skill: q.skills?.name ?? "No topic",
    domain: q.skills?.domains?.name ?? "",
    difficulty: q.difficulty,
    status: q.status,
    version: q.version,
    place,
  };
}
