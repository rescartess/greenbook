import { describe, expect, it } from "vitest";
import { backupReadme, planBackup, type BackupRows } from "./backup";
import { parseImportBook } from "./import-book";

// Made-up rows: one English topic, one SQB Math topic with a typed answer, one adaptive Math test,
// one draft and one question that is in no topic or test.
const rows: BackupRows = {
  skills: [
    { id: 1, slug: "words-in-context" },
    { id: 2, slug: "linear-functions" },
  ],
  sets: [
    { id: "t1", kind: "topic", title: "Words in Context", subject: "english", collection: "books", published: true, is_adaptive: false, month: null, sort_order: 1 },
    { id: "t2", kind: "topic", title: "Linear Functions", subject: "math", collection: "sqb", published: true, is_adaptive: false, month: null, sort_order: 1 },
    { id: "f1", kind: "full_test", title: "2099 January", subject: "math", collection: "books", published: true, is_adaptive: true, month: "2099-01-01", sort_order: 0 },
  ],
  modules: [
    { id: "m1", set_id: "t1", module_number: 1, tier: "standard", time_limit_sec: null, sort_order: 0 },
    { id: "m2", set_id: "t2", module_number: 1, tier: "standard", time_limit_sec: null, sort_order: 0 },
    { id: "f1a", set_id: "f1", module_number: 1, tier: "standard", time_limit_sec: 2100, sort_order: 1 },
    { id: "f1b", set_id: "f1", module_number: 2, tier: "harder", time_limit_sec: 2100, sort_order: 2 },
    { id: "f1c", set_id: "f1", module_number: 2, tier: "easier", time_limit_sec: 2100, sort_order: 3 },
  ],
  links: [
    { module_id: "m1", question_id: "q2", position: 2 },
    { module_id: "m1", question_id: "q1", position: 1 },
    { module_id: "m2", question_id: "q3", position: 1 },
    { module_id: "f1a", question_id: "q4", position: 1 },
    { module_id: "f1b", question_id: "q5", position: 1 },
    { module_id: "f1c", question_id: "q5", position: 1 },
  ],
  questions: [
    { id: "q1", subject: "english", skill_id: 1, difficulty: "easy", type: "mcq", passage: "A ______ day.", prompt: "Which word?", choices: [{ id: "A", text: "calm" }, { id: "B", text: "loud" }], image_path: null, status: "published", source: "S1" },
    { id: "q2", subject: "english", skill_id: 1, difficulty: "hard", type: "mcq", passage: null, prompt: "Pick one.", choices: [{ id: "A", text: "x" }, { id: "B", text: "y" }], image_path: "pics/a.png", status: "draft", source: "S2" },
    { id: "q3", subject: "math", skill_id: 2, difficulty: "medium", type: "spr", passage: null, prompt: "Slope?", choices: null, image_path: null, status: "published", source: "S3" },
    { id: "q4", subject: "math", skill_id: 2, difficulty: "easy", type: "mcq", passage: null, prompt: "2+2?", choices: [{ id: "A", text: "4" }, { id: "B", text: "5" }], image_path: "pics/b.png", status: "published", source: "S4" },
    { id: "q5", subject: "math", skill_id: 2, difficulty: "hard", type: "mcq", passage: null, prompt: "3+3?", choices: [{ id: "A", text: "6" }, { id: "B", text: "7" }], image_path: null, status: "published", source: "S5" },
    { id: "q6", subject: "english", skill_id: 1, difficulty: "easy", type: "mcq", passage: null, prompt: "Left over", choices: [{ id: "A", text: "a" }, { id: "B", text: "b" }], image_path: null, status: "draft", source: "LEFT" },
  ],
  answers: [
    { question_id: "q1", correct_answer: "A", accepted_answers: [], explanation: "Calm fits." },
    { question_id: "q2", correct_answer: "B", accepted_answers: [], explanation: null },
    { question_id: "q3", correct_answer: "24/5", accepted_answers: ["4.8"], explanation: "Rise over run." },
    { question_id: "q4", correct_answer: "A", accepted_answers: [], explanation: null },
    { question_id: "q5", correct_answer: "A", accepted_answers: [], explanation: null },
    { question_id: "q6", correct_answer: "A", accepted_answers: [], explanation: null },
  ],
};

describe("question backup", () => {
  const plan = planBackup(rows, new Date("2099-01-02T00:00:00Z"));
  const withPictures = (name: string) => {
    const f = plan.files.find((x) => x.name === name)!;
    return JSON.stringify({ ...f.book, images: Object.fromEntries(f.images.map((p) => [p, "AAAA"])) });
  };

  it("makes one import file per subject and collection, plus the full tests", () => {
    expect(plan.files.map((f) => f.name)).toEqual(["English topics (QuantumTest)", "Math topics (SQB)", "Math full tests"]);
  });

  it("writes files the import page accepts, in the admin's order, with answers and explanations", () => {
    const english = parseImportBook(withPictures("English topics (QuantumTest)"));
    expect(english.subject).toBe("english");
    expect(english.collection).toBe("books");
    expect(english.topics[0].topic).toBe("Words in Context");
    expect(english.topics[0].items.map((i) => i.source)).toEqual(["S1", "S2"]);
    expect(english.topics[0].items[0]).toMatchObject({ skill: "words-in-context", answer: "A", explanation: "Calm fits.", passage: "A ______ day." });
    expect(english.images).toEqual({ "pics/a.png": "AAAA" });

    const sqb = parseImportBook(withPictures("Math topics (SQB)"));
    expect(sqb.collection).toBe("sqb");
    expect(sqb.topics[0].items[0]).toMatchObject({ type: "spr", choices: [], answer: "24/5", accepted: ["4.8"] });

    const tests = parseImportBook(withPictures("Math full tests"));
    expect(tests.tests[0]).toMatchObject({ title: "2099 January", month: "2099-01-01", adaptive: true });
    expect(tests.tests[0].modules.map((m) => `${m.number} ${m.tier}`)).toEqual(["1 standard", "2 harder", "2 easier"]);
    expect(tests.images).toEqual({ "pics/b.png": "AAAA" });
  });

  it("counts everything and keeps what the import files can't carry", () => {
    expect(plan.manifest).toMatchObject({ questions: 6, answers: 6, pictures: 2, inImportFiles: 5 });
    expect(plan.manifest.onlyInRaw).toEqual([{ source: "LEFT", status: "draft", subject: "english" }]);
    expect(plan.manifest.draftQuestionsInImportFiles).toEqual(["S2"]);
    expect(plan.manifest.publishedTests).toEqual(["math: 2099 January"]);
    expect(plan.manifest.files.find((f) => f.name === "Math full tests.json")?.questions).toBe(2);
    expect(backupReadme(plan)).toContain("/admin/import");
  });
});
