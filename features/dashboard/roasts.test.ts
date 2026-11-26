import { describe, expect, it } from "vitest";
import { ROASTS, pickRoast } from "./roasts";

describe("dashboard roasts", () => {
  it("has many different lines, all short enough for the card", () => {
    expect(ROASTS.length).toBeGreaterThan(100);
    expect(new Set(ROASTS).size).toBe(ROASTS.length);
    for (const r of ROASTS) expect(r.length).toBeLessThanOrEqual(110);
  });

  it("never repeats the line that is on screen", () => {
    for (let i = 0; i < 200; i++) expect(pickRoast(ROASTS[0])).not.toBe(ROASTS[0]);
  });
});
