import { describe, expect, it } from "vitest";
import { monthLabel, parseOptions, parsePracticeState, scorePractice } from "./schema";

describe("practice", () => {
  it("reads questions and earlier feedback", () => {
    const s = parsePracticeState({
      attemptId: "a",
      attemptModuleId: "m",
      status: "in_progress",
      title: "Transitions 1",
      subject: "english",
      questions: [
        { id: "q1", position: 1, prompt: "P", choices: [{ id: "A", text: "x" }], feedback: { answer: "A", isCorrect: true, correctAnswer: "A", explanation: "E" } },
        { id: "q2", position: 2, prompt: "P", choices: [], feedback: null },
      ],
    });
    expect(s.questions[0].feedback?.isCorrect).toBe(true);
    expect(s.questions[1].feedback).toBeNull();
  });

  it("names months in plain English", () => {
    expect(monthLabel("2025-11-01")).toBe("November 2025");
  });

  it("reads the options a topic practice was started with", () => {
    expect(parseOptions({ difficulty: "easy", from: 21, to: 40, minutes: 24 })).toEqual({ difficulty: "easy", from: 21, to: 40, minutes: 24 });
    expect(parseOptions({ difficulty: "tricky", from: 1, to: 2 })).toBeNull();
    expect(parseOptions(null)).toBeNull();
  });

  it("scores a finished practice: right, wrong and skipped", () => {
    const fb = (answer: string | null, isCorrect: boolean) => ({ answer, isCorrect, correctAnswer: "A", explanation: null });
    const s = scorePractice([
      { answer: "A", feedback: fb("A", true) },
      { answer: "B", feedback: fb("B", false) },
      { answer: null, feedback: fb(null, false) },
      { answer: "A", feedback: fb("A", true) },
    ]);
    expect(s).toEqual({ correct: 2, incorrect: 1, skipped: 1, total: 4, percent: 50 });
  });
});
