import { describe, expect, it } from "vitest";
import { batches, imageType, parseImportBook } from "./import-book";

const item = {
  source: "Book Q1",
  skill: "english-inferences",
  difficulty: "easy",
  passage: "P",
  prompt: "Q?",
  choices: [
    { id: "A", text: "a" },
    { id: "B", text: "b" },
  ],
  answer: "B",
  image: "dovudprep/ii/001.webp",
};
const file = (over: Record<string, unknown> = {}, itemOver: Record<string, unknown> = {}) =>
  JSON.stringify({
    format: "greenbook-import-1",
    book: "Book 1",
    subject: "english",
    topics: [{ topic: "Inferences", items: [{ ...item, ...itemOver }] }],
    images: { "dovudprep/ii/001.webp": "AAAA" },
    ...over,
  });

describe("import files", () => {
  it("reads a good file", () => {
    const b = parseImportBook(file());
    expect(b.topics[0]).toMatchObject({ topic: "Inferences" });
    expect(b.topics[0].items[0]).toMatchObject({ source: "Book Q1", answer: "B", image: "dovudprep/ii/001.webp" });
  });

  it("explains what is wrong", () => {
    expect(() => parseImportBook("nope")).toThrow(/not the book PDFs/);
    expect(() => parseImportBook(file({ format: "x" }))).toThrow(/isn’t a GreenBook import file/);
    expect(() => parseImportBook(file({}, { answer: "D" }))).toThrow(/no correct answer/);
    expect(() => parseImportBook(file({}, { difficulty: "tricky" }))).toThrow(/no level/);
    expect(() => parseImportBook(file({ images: {} }))).toThrow(/picture that isn’t in the file/);
  });

  it("reads Math typed-answer questions", () => {
    const spr = { type: "spr", choices: [], answer: "24/5", accepted: ["4.8", 7], subject: "math" };
    const b = parseImportBook(file({ subject: "math" }, spr));
    expect(b.topics[0].items[0]).toMatchObject({ type: "spr", answer: "24/5", accepted: ["4.8"], choices: [] });
    expect(parseImportBook(file()).topics[0].items[0]).toMatchObject({ type: "mcq", accepted: [] });
    expect(() => parseImportBook(file({}, { type: "spr", answer: "" , choices: [] }))).toThrow(/no correct answer/);
    expect(() => parseImportBook(file({}, { type: "spr" }))).toThrow(/has answer choices/);
  });

  it("reads whole month tests", () => {
    const q = { source: "Sep A · M1 · 1", skill: "english-words-in-context", difficulty: "easy", passage: "P", prompt: "Q",
      choices: [{ id: "A", text: "a" }, { id: "B", text: "b" }], answer: "B", image: null };
    const tests = [{ title: "2025 September A", month: "2025-09-01", modules: [
      { number: 1, tier: "standard", items: [q] }, { number: 2, tier: "harder", items: [{ ...q, source: "Sep A · M2 · 1" }] }] }];
    const b = parseImportBook(JSON.stringify({ format: "greenbook-import-1", subject: "english", tests, images: {} }));
    expect(b.topics).toEqual([]);
    expect(b.tests[0]).toMatchObject({ title: "2025 September A", month: "2025-09-01", adaptive: false });
    expect(b.tests[0].modules.map((m) => [m.number, m.tier])).toEqual([[1, "standard"], [2, "harder"]]);
    const noModule1 = [{ ...tests[0], modules: [tests[0].modules[1]] }];
    expect(() => parseImportBook(JSON.stringify({ format: "greenbook-import-1", tests: noModule1 }))).toThrow(/one Module 1/);
  });

  it("splits into batches and names picture types", () => {
    expect(batches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(imageType("a/b.webp")).toBe("image/webp");
    expect(imageType("a/b.PNG")).toBe("image/png");
  });
});
