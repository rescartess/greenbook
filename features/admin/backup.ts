/**
 * Question backup (owner request 28 Nov 2026): every question, answer, explanation, topic and full test,
 * written two ways so nothing is lost if the site is ever rebuilt:
 *  1. Import files (format "greenbook-import-1") that /admin/import loads straight back in:
 *     per subject, the QuantumTest topics, the SQB topics and the full tests. Each file carries the
 *     pictures its questions use.
 *  2. raw.json: an exact copy of the rows (ids, drafts, months, questions not in any topic or test).
 * Plus manifest.json (counts, what was published) and README.txt (how to restore).
 * This file only arranges rows; BackupPanel fetches them and the pictures, and zips everything.
 */

type Subject = "english" | "math";

export type BackupSet = {
  id: string;
  kind: string;
  title: string;
  subject: string;
  collection: string;
  published: boolean;
  is_adaptive: boolean;
  month: string | null;
  sort_order: number;
};
export type BackupModule = { id: string; set_id: string; module_number: number; tier: string; time_limit_sec: number | null; sort_order: number };
export type BackupLink = { module_id: string; question_id: string; position: number };
export type BackupQuestion = {
  id: string;
  subject: string;
  skill_id: number | null;
  difficulty: string;
  type: string;
  passage: string | null;
  prompt: string;
  choices: unknown;
  image_path: string | null;
  status: string;
  source: string | null;
};
export type BackupAnswer = { question_id: string; correct_answer: string; accepted_answers: string[]; explanation: string | null };
export type BackupSkill = { id: number; slug: string };

export type BackupRows = {
  sets: BackupSet[];
  modules: BackupModule[];
  links: BackupLink[];
  questions: BackupQuestion[];
  answers: BackupAnswer[];
  skills: BackupSkill[];
};

type Item = {
  source: string;
  skill: string | null;
  difficulty: string;
  type: string;
  passage: string | null;
  prompt: string;
  choices: unknown;
  answer: string;
  accepted: string[];
  explanation: string | null;
  image: string | null;
};

/** One import file before its pictures are added. */
export type BackupFilePlan = {
  name: string;
  book: {
    format: "greenbook-import-1";
    book: string;
    subject: Subject;
    collection: "books" | "sqb";
    topics: { topic: string; items: Item[] }[];
    tests: { title: string; month: string | null; adaptive: boolean; modules: { number: number; tier: string; minutes: number | null; items: Item[] }[] }[];
  };
  images: string[];
  questions: number;
};

export type BackupPlan = {
  files: BackupFilePlan[];
  manifest: {
    made: string;
    questions: number;
    answers: number;
    pictures: number;
    inImportFiles: number;
    onlyInRaw: { source: string | null; status: string; subject: string }[];
    publishedTests: string[];
    hiddenTests: string[];
    hiddenTopics: string[];
    draftQuestionsInImportFiles: string[];
    files: { name: string; questions: number; pictures: number }[];
  };
};

const SUBJECTS: Subject[] = ["english", "math"];
const LABEL: Record<Subject, string> = { english: "English", math: "Math" };

/** Arranges the rows into import files (in the admin's order) and a manifest. */
export function planBackup(rows: BackupRows, made: Date): BackupPlan {
  const slug = new Map(rows.skills.map((s) => [s.id, s.slug]));
  const answer = new Map(rows.answers.map((a) => [a.question_id, a]));
  const question = new Map(rows.questions.map((q) => [q.id, q]));
  const modulesOf = new Map<string, BackupModule[]>();
  for (const m of rows.modules) modulesOf.set(m.set_id, [...(modulesOf.get(m.set_id) ?? []), m]);
  const linksOf = new Map<string, BackupLink[]>();
  for (const l of rows.links) linksOf.set(l.module_id, [...(linksOf.get(l.module_id) ?? []), l]);

  const used = new Set<string>();
  const drafts: string[] = [];

  const items = (moduleId: string, images: Set<string>): Item[] =>
    (linksOf.get(moduleId) ?? [])
      .slice().sort((a, b) => a.position - b.position)
      .flatMap((l) => {
        const q = question.get(l.question_id);
        const a = answer.get(l.question_id);
        if (!q || !a) return [];
        used.add(q.id);
        if (q.status !== "published") drafts.push(q.source ?? q.id);
        if (q.image_path) images.add(q.image_path);
        return [
          {
            source: q.source ?? `backup ${q.id}`,
            skill: q.skill_id == null ? null : (slug.get(q.skill_id) ?? null),
            difficulty: q.difficulty,
            type: q.type,
            passage: q.passage,
            prompt: q.prompt,
            choices: q.type === "spr" ? [] : (q.choices ?? []),
            answer: a.correct_answer,
            accepted: a.accepted_answers ?? [],
            explanation: a.explanation,
            image: q.image_path,
          },
        ];
      });

  const sortedModules = (setId: string) =>
    (modulesOf.get(setId) ?? []).slice().sort((a, b) => a.sort_order - b.sort_order || a.module_number - b.module_number);

  const files: BackupFilePlan[] = [];
  for (const subject of SUBJECTS) {
    for (const collection of ["books", "sqb"] as const) {
      const images = new Set<string>();
      const topics = rows.sets
        .filter((s) => s.kind === "topic" && s.subject === subject && s.collection === collection)
        .slice().sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title))
        .map((s) => ({ topic: s.title, items: sortedModules(s.id).flatMap((m) => items(m.id, images)) }))
        .filter((t) => t.items.length > 0);
      if (topics.length === 0) continue;
      const name = `${LABEL[subject]} topics (${collection === "sqb" ? "SQB" : "QuantumTest"})`;
      files.push({
        name,
        book: { format: "greenbook-import-1", book: `Backup: ${name}`, subject, collection, topics, tests: [] },
        images: [...images],
        questions: topics.reduce((n, t) => n + t.items.length, 0),
      });
    }
    const images = new Set<string>();
    const tests = rows.sets
      .filter((s) => s.kind === "full_test" && s.subject === subject)
      .slice().sort((a, b) => (a.month ?? "").localeCompare(b.month ?? "") || a.title.localeCompare(b.title))
      .map((s) => ({
        title: s.title,
        month: s.month ? `${s.month.slice(0, 7)}-01` : null,
        adaptive: s.is_adaptive,
        modules: sortedModules(s.id).map((m) => ({
          number: m.module_number,
          tier: m.tier,
          minutes: m.time_limit_sec == null ? null : Math.round(m.time_limit_sec / 60),
          items: items(m.id, images),
        })),
      }))
      .filter((t) => t.modules.some((m) => m.items.length > 0));
    if (tests.length > 0) {
      const name = `${LABEL[subject]} full tests`;
      files.push({
        name,
        book: { format: "greenbook-import-1", book: `Backup: ${name}`, subject, collection: "books", topics: [], tests },
        images: [...images],
        questions: new Set(tests.flatMap((t) => t.modules.flatMap((m) => m.items.map((i) => i.source)))).size,
      });
    }
  }

  const tests = rows.sets.filter((s) => s.kind === "full_test");
  return {
    files,
    manifest: {
      made: made.toISOString(),
      questions: rows.questions.length,
      answers: rows.answers.length,
      pictures: new Set(rows.questions.flatMap((q) => (q.image_path ? [q.image_path] : []))).size,
      inImportFiles: used.size,
      onlyInRaw: rows.questions.filter((q) => !used.has(q.id)).map((q) => ({ source: q.source, status: q.status, subject: q.subject })),
      publishedTests: tests.filter((s) => s.published).map((s) => `${s.subject}: ${s.title}`),
      hiddenTests: tests.filter((s) => !s.published).map((s) => `${s.subject}: ${s.title}`),
      hiddenTopics: rows.sets.filter((s) => s.kind === "topic" && !s.published).map((s) => `${s.subject} ${s.collection}: ${s.title}`),
      draftQuestionsInImportFiles: [...new Set(drafts)],
      files: files.map((f) => ({ name: `${f.name}.json`, questions: f.questions, pictures: f.images.length })),
    },
  };
}

/** The restore steps, saved in the zip as README.txt. */
export function backupReadme(plan: BackupPlan): string {
  const m = plan.manifest;
  return [
    "QuantumTest question backup",
    `Made ${m.made}. ${m.questions} questions, ${m.answers} answers, ${m.pictures} pictures.`,
    "",
    "Keep this file private: it holds every answer and explanation.",
    "",
    "HOW TO RESTORE (after rebuilding the site with QUANTUMTEST_REBUILD.md)",
    "1. Unzip this file.",
    "2. Sign in to the new site as the admin and open /admin/import.",
    "3. Choose the topic files first, then the full-test files:",
    ...m.files.map((f) => `   - ${f.name}  (${f.questions} questions, ${f.pictures} pictures)`),
    "   Leave \"Publish these topics when done\" on. The pictures upload by themselves.",
    "4. Full tests come back hidden. Under Tests, publish the ones listed in manifest.json as publishedTests.",
    m.draftQuestionsInImportFiles.length
      ? `5. ${m.draftQuestionsInImportFiles.length} questions were drafts; manifest.json lists them (draftQuestionsInImportFiles). Hide them again if needed.`
      : "5. No draft questions in the import files.",
    "",
    "raw.json is an exact copy of the database rows (ids, drafts, and the",
    `${m.onlyInRaw.length} questions that were in no topic or test). Use it if the import files are not enough:`,
    "ask Claude to turn raw.json into SQL for the new database.",
    "",
  ].join("\n");
}
