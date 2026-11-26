import { describe, expect, it } from "vitest";
import { cardView, parseAttempts } from "./schema";

const [unfinished, test, practice] = parseAttempts([
  { id: "1", setId: "s", setTitle: "Boundaries", setKind: "topic", name: "Monday", status: "in_progress", options: { difficulty: "easy", from: 21, to: 40, minutes: null }, startedAt: "2026-11-26T12:00:00Z", modules: [{ number: null, tier: null, total: 20, answered: 7, correct: null }] },
  { id: "2", setId: "s", setTitle: "Practice test 1", setKind: "full_test", name: null, status: "completed", startedAt: "2026-11-26T09:00:00Z", scaledScore: 560, rawCorrect: 31, modules: [{ number: 1, tier: "standard", total: 27, answered: 27, correct: 17 }, { number: 2, tier: "harder", total: 27, answered: 25, correct: 14 }] },
  { id: "3", setId: "s", setTitle: "Inferences", setKind: "topic", name: null, status: "completed", options: { difficulty: "hard", from: 1, to: 10 }, startedAt: "2026-11-25T09:00:00Z", modules: [{ number: null, total: 10, answered: 10, correct: 6 }] },
  { id: "bad", setKind: "mistakes_review" },
]);

describe("Results cards", () => {
  it("skips rows it can't read", () => {
    expect(parseAttempts([{ id: "x" }, null])).toEqual([]);
  });

  it("an unfinished practice shows answered and left, and continues where it stopped", () => {
    const v = cardView(unfinished, "english");
    expect(v).toMatchObject({ title: "Monday", subtitle: "Topic: Boundaries", finished: false, canRetake: false });
    expect(v.stats).toEqual([
      { label: "Answered", value: "7", of: "of 20" },
      { label: "Left", value: "13", of: null },
    ]);
    expect(v.rows).toEqual([{ label: "Easy, #21–40", value: "7/20", share: 7 / 20 }]);
    expect(v.primary).toEqual({ label: "Continue", href: "/practice/1" });
  });

  it("a finished full test shows the score of 800 and each module", () => {
    const v = cardView(test, "english");
    expect(v.stats[0]).toEqual({ label: "Final score", value: "560", of: "of 800" });
    expect(v.stats[1]).toEqual({ label: "Final result", value: "31", of: "of 54" });
    expect(v.rows.map((r) => r.label)).toEqual(["Module 1", "Module 2 (harder)"]);
    expect(v.primary).toEqual({ label: "See details", href: "/english/results/2" });
    expect(v.canRetake).toBe(true);
  });

  it("a finished practice without a name uses the topic and range", () => {
    const v = cardView(practice, "english");
    expect(v.title).toBe("Inferences");
    expect(v.subtitle).toBe("Topic practice, #1–10");
    expect(v.stats[1]).toEqual({ label: "Accuracy", value: "60%", of: null });
    expect(v.primary.href).toBe("/practice/3");
  });
});
