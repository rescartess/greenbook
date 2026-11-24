import { describe, expect, it } from "vitest";
import { formatClock, parseTestState, saveErrorMessage } from "./schema";

describe("parseTestState", () => {
  it("reads a running module", () => {
    const state = parseTestState({
      attemptId: "a1",
      status: "in_progress",
      title: "Practice test 1",
      subject: "english",
      module: { attemptModuleId: "m1", number: 1, deadlineAt: "2026-01-01T00:32:00Z", serverNow: "2026-01-01T00:00:00Z", isLast: false },
      questions: [{ id: "q1", position: 1, type: "mcq", passage: "P", prompt: "Q", choices: [{ id: "A", text: "a" }] }],
      responses: [{ questionId: "q1", answer: "A", marked: true, eliminated: ["B"] }],
    });
    expect(state.status).toBe("in_progress");
    if (state.status !== "in_progress") return;
    expect(state.questions[0].choices).toEqual([{ id: "A", text: "a" }]);
    expect(state.responses.q1).toEqual({ answer: "A", marked: true, eliminated: ["B"] });
  });

  it("knows when the test is over", () => {
    expect(parseTestState({ attemptId: "a1", status: "completed" }).status).toBe("completed");
  });

  it("refuses broken data", () => {
    expect(() => parseTestState(null)).toThrow();
  });
});

describe("formatClock", () => {
  it.each([
    [1902000, "31:42"],
    [7000, "0:07"],
    [3909000, "1:05:09"],
    [-5, "0:00"],
    [1001, "0:02"],
  ])("%i ms -> %s", (ms, text) => expect(formatClock(ms)).toBe(text));
});

describe("saveErrorMessage", () => {
  it("reloads when time is up but keeps trying on network trouble", () => {
    expect(saveErrorMessage("P0004").reload).toBe(true);
    expect(saveErrorMessage(undefined).reload).toBe(false);
  });
});
