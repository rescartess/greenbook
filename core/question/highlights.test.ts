import { describe, expect, it } from "vitest";
import { mergeSpans } from "./highlights";

describe("mergeSpans", () => {
  it("joins overlapping and touching highlights and drops empty ones", () => {
    expect(
      mergeSpans([
        { start: 10, end: 20 },
        { start: 0, end: 5 },
        { start: 18, end: 25 },
        { start: 25, end: 30 },
        { start: 40, end: 40 },
      ]),
    ).toEqual([
      { start: 0, end: 5 },
      { start: 10, end: 30 },
    ]);
  });
});

describe("colored highlights", () => {
  it("reads old saved highlights as yellow", async () => {
    const { toMarks } = await import("./highlights");
    expect(toMarks([{ start: 2, end: 5 }, { start: 9, end: 9 }, "x"])).toEqual([
      { start: 2, end: 5, color: "yellow", underline: false },
    ]);
  });

  it("a new highlight replaces just the part it covers", async () => {
    const { addMark } = await import("./highlights");
    const old = [
      { start: 0, end: 20, color: "yellow" as const, underline: true },
    ];
    expect(
      addMark(old, { start: 5, end: 10, color: "pink", underline: false }),
    ).toEqual([
      { start: 0, end: 5, color: "yellow", underline: true },
      { start: 5, end: 10, color: "pink", underline: false },
      { start: 10, end: 20, color: "yellow", underline: true },
    ]);
  });

  it("finds the highlight under a position", async () => {
    const { markAt } = await import("./highlights");
    const marks = [
      { start: 3, end: 6, color: "blue" as const, underline: false },
    ];
    expect(markAt(marks, 3)?.color).toBe("blue");
    expect(markAt(marks, 6)).toBeNull();
  });
});
