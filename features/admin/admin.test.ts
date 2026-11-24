import { describe, expect, it } from "vitest";
import { parseQuestionForm, publishProblems } from "./schema";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values: Record<string, string> = {
    passage: "A *short* passage with a ______.",
    prompt: "Which choice completes the text?",
    choice_A: "alpha",
    choice_B: "beta",
    choice_C: "gamma",
    choice_D: "delta",
    correct: "B",
    explanation: "Because.",
    skillId: "12",
    difficulty: "medium",
    status: "draft",
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) data.set(k, v);
  return data;
}

describe("parseQuestionForm", () => {
  it("accepts a complete question", () => {
    const result = parseQuestionForm(form());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.correct).toBe("B");
      expect(result.value.choices.map((c) => c.id)).toEqual([
        "A",
        "B",
        "C",
        "D",
      ]);
      expect(result.value.skillId).toBe(12);
    }
  });

  it("stores an empty passage or explanation as nothing", () => {
    const result = parseQuestionForm(form({ passage: "  ", explanation: "" }));
    expect(
      result.ok &&
        result.value.passage === null &&
        result.value.explanation === null,
    ).toBe(true);
  });

  it("explains every problem in plain words", () => {
    const result = parseQuestionForm(
      form({
        prompt: "",
        choice_C: "",
        correct: "E",
        skillId: "x",
        difficulty: "brutal",
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields.prompt).toBe("Write the question.");
      expect(result.fields.choices).toBe("Fill in all four choices.");
      expect(result.fields.correct).toBe("Pick the correct answer.");
      expect(result.fields.skillId).toBe("Pick a topic.");
      expect(result.fields.difficulty).toBe("Pick a difficulty.");
    }
  });

  it("catches duplicate choices", () => {
    const result = parseQuestionForm(form({ choice_D: "Alpha" }));
    expect(!result.ok && result.fields.choices).toBe(
      "Two choices are the same.",
    );
  });
});

describe("publishProblems", () => {
  const m1 = {
    moduleNumber: 1,
    tier: "standard",
    questions: 27,
    withoutAnswer: 0,
  };
  const hard = {
    moduleNumber: 2,
    tier: "harder",
    questions: 27,
    withoutAnswer: 0,
  };
  const easy = {
    moduleNumber: 2,
    tier: "easier",
    questions: 27,
    withoutAnswer: 0,
  };

  it("needs both module 2 versions for an adaptive test", () => {
    expect(publishProblems(true, [m1, hard])).toEqual([
      "Module 2 (easier) has no questions yet.",
    ]);
    expect(publishProblems(true, [m1, hard, easy])).toEqual([]);
  });

  it("counts questions without an answer", () => {
    expect(publishProblems(false, [m1, { ...hard, withoutAnswer: 2 }])).toEqual(
      ["2 questions have no correct answer."],
    );
  });
});
