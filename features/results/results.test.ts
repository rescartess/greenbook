import { describe, expect, it } from "vitest";
import { accuracyByArea, filledSegments, moduleLabel, parseResults } from "./schema";

const sample = {
  attemptId: "a1",
  title: "Practice test 1",
  subject: "english",
  rawCorrect: 2,
  scaledScore: 300,
  modules: [
    {
      number: 1,
      tier: "standard",
      correct: 2,
      total: 3,
      questions: [
        { id: "q1", position: 1, prompt: "P", domain: "Craft and Structure", isCorrect: true, answer: "A", correctAnswer: "A" },
        { id: "q2", position: 2, prompt: "P", domain: "Craft and Structure", isCorrect: false, answer: null, correctAnswer: "B" },
        { id: "q3", position: 3, prompt: "P", domain: "Expression of Ideas", isCorrect: true, answer: "C", correctAnswer: "C" },
      ],
    },
  ],
};

describe("results", () => {
  it("reads the database's results", () => {
    const r = parseResults(sample);
    expect(r.modules[0].questions[1]).toMatchObject({ answer: null, isCorrect: false, correctAnswer: "B" });
  });

  it("works out accuracy per area and skips empty areas", () => {
    const r = parseResults(sample);
    expect(accuracyByArea(r, ["Information and Ideas", "Craft and Structure", "Expression of Ideas"])).toEqual([
      { area: "Craft and Structure", correct: 1, total: 2, percent: 50 },
      { area: "Expression of Ideas", correct: 1, total: 1, percent: 100 },
    ]);
  });

  it("fills breakdown segments and names modules", () => {
    expect(filledSegments(0, 10)).toBe(0);
    expect(filledSegments(5, 10)).toBe(4);
    expect(filledSegments(10, 10)).toBe(7);
    expect(filledSegments(0, 0)).toBe(0);
    expect(moduleLabel({ number: 2, tier: "harder" })).toBe("Module 2 (harder)");
    expect(moduleLabel({ number: 1, tier: "standard" })).toBe("Module 1");
  });

  it("reads marks for review", () => {
    const r = parseResults({ ...sample, modules: [{ ...sample.modules[0], questions: [{ ...sample.modules[0].questions[0], marked: true }] }] });
    expect(r.modules[0].questions[0].marked).toBe(true);
  });
});
