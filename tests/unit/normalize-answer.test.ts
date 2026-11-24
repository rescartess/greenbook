import { describe, expect, it } from "vitest";
import { isAnswerCorrect, parseAnswer } from "@/core/scoring/normalize-answer";

describe("parseAnswer", () => {
  it("reads fractions, decimals and signs", () => {
    expect(parseAnswer("3/2")).toBe(1.5);
    expect(parseAnswer(" 1.50 ")).toBe(1.5);
    expect(parseAnswer("+4")).toBe(4);
    expect(parseAnswer("-7/2")).toBe(-3.5);
    expect(parseAnswer(".25")).toBe(0.25);
  });

  it("rejects text that is not a number", () => {
    expect(parseAnswer("")).toBeNull();
    expect(parseAnswer("abc")).toBeNull();
    expect(parseAnswer("1/0")).toBeNull();
    expect(parseAnswer("1..2")).toBeNull();
  });
});

describe("isAnswerCorrect", () => {
  it("treats equivalent forms as the same answer", () => {
    expect(isAnswerCorrect("1.5", ["3/2"])).toBe(true);
    expect(isAnswerCorrect("3/2", ["1.5"])).toBe(true);
    expect(isAnswerCorrect(" 1.50 ", ["3/2"])).toBe(true);
  });

  it("only accepts rounded decimals the question lists", () => {
    expect(isAnswerCorrect("0.6", ["2/3"])).toBe(false);
    expect(isAnswerCorrect("0.666", ["2/3", "0.666", "0.667"])).toBe(true);
  });

  it("marks wrong and empty answers incorrect", () => {
    expect(isAnswerCorrect("2", ["3/2"])).toBe(false);
    expect(isAnswerCorrect("", ["3/2"])).toBe(false);
  });
});
