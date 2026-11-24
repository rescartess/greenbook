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
