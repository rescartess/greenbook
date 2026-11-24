import { describe, expect, it } from "vitest";
import { monthLabel, parsePracticeState } from "./schema";

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
});
