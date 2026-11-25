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

  it("splits into batches and names picture types", () => {
    expect(batches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(imageType("a/b.webp")).toBe("image/webp");
    expect(imageType("a/b.PNG")).toBe("image/png");
  });
});
