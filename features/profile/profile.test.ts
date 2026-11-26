import { describe, expect, it } from "vitest";
import { lastSevenDays, parseName, parseTarget } from "./schema";

describe("profile rules", () => {
  it("tidies names and refuses empty or long ones", () => {
    expect(parseName("  Aziza   Karimova ")).toEqual({ ok: true, name: "Aziza Karimova" });
    expect(parseName("   ").ok).toBe(false);
    expect(parseName("x".repeat(41)).ok).toBe(false);
  });

  it("accepts a target from 400 to 1600 in steps of 10, or empty to clear it", () => {
    expect(parseTarget("1400")).toEqual({ ok: true, target: 1400 });
    expect(parseTarget("")).toEqual({ ok: true, target: null });
    expect(parseTarget("1405").ok).toBe(false);
    expect(parseTarget("390").ok).toBe(false);
    expect(parseTarget("1610").ok).toBe(false);
    expect(parseTarget("abc").ok).toBe(false);
  });

  it("lists the last 7 days, oldest first, ending today", () => {
    expect(lastSevenDays(new Date("2026-11-26T09:00:00Z"))).toEqual([
      "2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26",
    ]);
  });
});
