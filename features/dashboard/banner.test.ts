import { describe, expect, it } from "vitest";
import { ordinal, practiceTime, topPercent } from "./banner";

describe("dashboard banner numbers", () => {
  it("shows practice time like a stopwatch", () => {
    expect(practiceTime(0)).toBe("00:00:00");
    expect(practiceTime(3725)).toBe("01:02:05");
    expect(practiceTime(232184)).toBe("64:29:44");
  });

  it("writes places in English", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th",
    ]);
  });

  it("gives the top share, at least 1%", () => {
    expect(topPercent(1, 400)).toBe(1);
    expect(topPercent(3, 41)).toBe(8);
    expect(topPercent(31, 31)).toBe(100);
  });
});
