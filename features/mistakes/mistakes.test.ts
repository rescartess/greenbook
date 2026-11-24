import { describe, expect, it } from "vitest";
import { groupMistakes, parseMistakes, parseRetry } from "./schema";

describe("mistakes", () => {
  const list = parseMistakes([
    { id: "1", prompt: "a", domain: "Craft and Structure", skill: "Words in Context", timesWrong: 2 },
    { id: "2", prompt: "b", domain: "Craft and Structure", skill: "Words in Context" },
    { id: "3", prompt: "c", domain: "Expression of Ideas", skill: "Transitions" },
  ]);

  it("groups by area and topic", () => {
    const groups = groupMistakes(list);
    expect(groups.map((g) => g.area)).toEqual(["Craft and Structure", "Expression of Ideas"]);
    expect(groups[0].topics[0].items.map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("reads retry feedback", () => {
    expect(parseRetry({ answer: "A", isCorrect: true, correctAnswer: "A", explanation: null, mastered: true })).toMatchObject({
      isCorrect: true,
      mastered: true,
    });
  });
});
