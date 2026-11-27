import { beforeAll, describe, expect, it } from "vitest";
import { SUBJECTS } from "@/core/config/subjects";
import { freshDatabase } from "./db";

/*
 * The Math directions show a table of typed answers that get credit and ones that don't
 * (core/config/subjects.ts). The grader must agree with every example. Each answer is stored the
 * way imports store typed answers: a correct form plus the decimal forms cut or rounded to fit.
 */
const STORED: { correct: string; accepted: string[] }[] = [
  { correct: "7/2", accepted: [] },
  { correct: "2/3", accepted: [".6666", ".6667", "0.666", "0.667"] },
  { correct: "-1/3", accepted: ["-.3333", "-0.333"] },
];

let t: Awaited<ReturnType<typeof freshDatabase>>;

beforeAll(async () => {
  t = await freshDatabase();
  await t.actAsOwner();
});

const matches = async (given: string, stored: { correct: string; accepted: string[] }) =>
  (await t.one<{ v: boolean }>(`select private.answer_matches($1, $2, $3) v`, [given, stored.correct, stored.accepted])).v;

describe("Math directions examples agree with the grader", () => {
  const rows = SUBJECTS.math.directionExamples ?? [];

  it("has one stored answer per example row", () => {
    expect(rows).toHaveLength(STORED.length);
  });

  rows.forEach((row, i) => {
    it.each(row.accepted)(`row ${i + 1}: %j gets credit`, async (given) => {
      expect(await matches(given, STORED[i])).toBe(true);
    });
    it.each(row.rejected)(`row ${i + 1}: %j gets no credit`, async (given) => {
      expect(await matches(given, STORED[i])).toBe(false);
    });
  });
});
