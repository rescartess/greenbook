import { describe, expect, it } from "vitest";
import { rangeLabel, satPaceMinutes } from "@/core/config/practice";
import { chunks, chunkStatus, itemsFor, levelCounts, parseTopic, parseTopics, suggestedStart, type TopicItem } from "./schema";

const items: TopicItem[] = [
  { level: "easy", result: "correct" },
  { level: "easy", result: "wrong" },
  { level: "medium", result: null },
  { level: "easy", result: null },
  { level: "hard", result: "correct" },
];

describe("topics", () => {
  it("reads the topic list with level counts", () => {
    const [t] = parseTopics([{ id: "t1", title: "Boundaries", easy: 36, medium: 110, hard: 133, done: 4, open: 1, published: true }]);
    expect(t).toMatchObject({ title: "Boundaries", total: 279, done: 4, open: 1, published: true });
    expect(parseTopics(null)).toEqual([]);
  });

  it("reads one topic and its unfinished practices", () => {
    const t = parseTopic({
      id: "t1",
      title: "Boundaries",
      items: [{ d: "easy", r: "correct" }, { d: "hard", r: null }, { d: "weird" }],
      open: [{ attemptId: "a1", options: { difficulty: "easy", from: 21, to: 40 }, checkMode: "end", answered: 3, total: 20 }],
    });
    expect(t?.items).toEqual([
      { level: "easy", result: "correct" },
      { level: "hard", result: null },
    ]);
    expect(t?.open[0]).toMatchObject({ difficulty: "easy", from: 21, to: 40, checkMode: "end", answered: 3 });
    expect(parseTopic({})).toBeNull();
  });

  it("numbers questions within the chosen level, in the fixed order", () => {
    expect(itemsFor(items, "easy").map((i) => i.result)).toEqual(["correct", "wrong", null]);
    expect(levelCounts(items)).toEqual({ all: 5, easy: 3, medium: 1, hard: 1 });
  });

  it("splits into ranges with progress and suggests the first unfinished one", () => {
    const c = chunks(items, 2);
    expect(c.map((x) => [x.from, x.to])).toEqual([
      [1, 2],
      [3, 4],
      [5, 5],
    ]);
    expect(chunkStatus(c[0])).toBe("Done, 1 right");
    expect(chunkStatus(c[1])).toBe("Not started");
    expect(suggestedStart(items, 2)).toBe(3);
    expect(suggestedStart([], 20)).toBe(1);
  });

  it("labels ranges and works out SAT pace", () => {
    expect(rangeLabel({ difficulty: "easy", from: 1, to: 25 })).toBe("Easy, #1–25");
    expect(rangeLabel({ difficulty: "all", from: 7, to: 7 })).toBe("All levels, #7");
    expect(satPaceMinutes("english", 27)).toBe(32);
    expect(satPaceMinutes("english", 25)).toBe(30);
  });
});
