import "server-only";
import {
  parseChoices,
  toPlainText,
  type QuestionContent,
} from "@/core/question";
import { createDbClient } from "@/core/db/server";
import { isExternalId, isUuid, moduleLabel, publishProblems } from "./schema";

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
    .select(
      "id, title, subject, published, modules(module_number, tier, sort_order, module_questions(count))",
    )
    .order("created_at");
  if (error) throw new Error(`Could not load tests: ${error.message}`);

  return data.map((set) => ({
    id: set.id,
    title: set.title,
    subject: set.subject,
    published: set.published,
    modules: [...set.modules]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({
        label: moduleLabel(m.module_number, m.tier),
        count: m.module_questions[0]?.count ?? 0,
      })),
  }));
}

export type AdminTestDetail = {
  id: string;
  title: string;
  subject: string;
  published: boolean;
  /** Reasons the test can't be published yet; empty when it's ready. */
  problems: string[];
  /** Module 2 versions an adaptive test still needs ("easier", "harder"). */
  missingTiers: string[];
  modules: {
    id: string;
    label: string;
    minutes: number | null;
    questions: { id: string; position: number; externalId: string; preview: string; skill: string; difficulty: string; answer: string }[];
  }[];
};

export async function getTest(setId: string): Promise<AdminTestDetail | null> {
  if (!isUuid(setId)) return null;
  const supabase = await createDbClient();
  const { data, error } = await supabase
    .from("question_sets")
    .select(
      "id, title, subject, published, is_adaptive, modules(id, module_number, tier, sort_order, time_limit_sec, module_questions(position, questions(id, external_id, difficulty, passage, prompt, skills(name), question_answers(correct_answer))))",
    )
    .eq("id", setId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the test: ${error.message}`);
  if (!data) return null;

  const checks = data.modules.map((m) => ({
    moduleNumber: m.module_number,
    tier: m.tier,
    questions: m.module_questions.length,
    withoutAnswer: m.module_questions.filter(
      (mq) => !mq.questions?.question_answers?.correct_answer,
    ).length,
  }));

  return {
    id: data.id,
    title: data.title,
    subject: data.subject,
    published: data.published,
    problems: publishProblems(data.is_adaptive, checks),
    missingTiers: data.is_adaptive
      ? ["easier", "harder"].filter((tier) => !data.modules.some((m) => m.module_number === 2 && m.tier === tier))
      : [],
    modules: [...data.modules]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({
        id: m.id,
        label: moduleLabel(m.module_number, m.tier),
        minutes: m.time_limit_sec ? Math.round(m.time_limit_sec / 60) : null,
        questions: [...m.module_questions]
          .sort((a, b) => a.position - b.position)
          .flatMap((mq) => {
            const q = mq.questions;
            if (!q) return [];
            return [
              {
                id: q.id,
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
  subject: string;
  type: string;
  skillId: number | null;
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

export async function getQuestionPreview(
  externalId: string,
): Promise<AdminQuestionPreview | null> {
  if (!isExternalId(externalId)) return null;
  const supabase = await createDbClient();
  const { data: q, error } = await supabase
    .from("questions")
    .select(
      "external_id, subject, type, skill_id, passage, prompt, choices, difficulty, status, version, skills(name, domains(name)), question_answers(correct_answer, explanation), module_questions(position, module_id, modules(module_number, tier, question_sets(id, title)))",
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
    if (siblingsError)
      throw new Error(`Could not load the module: ${siblingsError.message}`);
    const idAt = (position: number) =>
      siblings.find((s) => s.position === position)?.questions?.external_id ??
      null;
    place = {
      testId: set.id,
      testTitle: set.title,
      moduleLabel: moduleLabel(
        membership.modules.module_number,
        membership.modules.tier,
      ),
      position: membership.position,
      total: siblings.length,
      previousId: idAt(membership.position - 1),
      nextId: idAt(membership.position + 1),
    };
  }

  return {
    externalId: q.external_id,
    subject: q.subject,
    type: q.type,
    skillId: q.skill_id,
    content: {
      passage: q.passage,
      prompt: q.prompt,
      choices: parseChoices(q.choices),
    },
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

export type SkillGroup = {
  domain: string;
  skills: { id: number; name: string }[];
};

/** Topics for one subject, grouped by area, in the official order. */
export async function listSkills(subject: string): Promise<SkillGroup[]> {
  const supabase = await createDbClient();
  const { data, error } = await supabase
    .from("domains")
    .select("name, sort_order, skills(id, name, slug, sort_order)")
    .eq("subject", subject)
    .order("sort_order");
  if (error) throw new Error(`Could not load topics: ${error.message}`);
  return data.map((d) => ({
    domain: d.name,
    skills: [...d.skills]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((k) => ({ id: k.id, name: k.name })),
  }));
}

export type ModuleInfo = { id: string; label: string; setId: string; testTitle: string; subject: string; count: number };

export async function getModuleInfo(moduleId: string): Promise<ModuleInfo | null> {
  if (!isUuid(moduleId)) return null;
  const supabase = await createDbClient();
  const { data, error } = await supabase
    .from("modules")
    .select("id, module_number, tier, set_id, question_sets(title, subject), module_questions(count)")
    .eq("id", moduleId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the module: ${error.message}`);
  if (!data || !data.question_sets) return null;
  return {
    id: data.id,
    label: moduleLabel(data.module_number, data.tier),
    setId: data.set_id,
    testTitle: data.question_sets.title,
    subject: data.question_sets.subject,
    count: data.module_questions[0]?.count ?? 0,
  };
}
