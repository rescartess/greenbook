import { describe, expect, it } from "vitest";
import { switchSubjectPath } from "@/core/config/subjects";

describe("switchSubjectPath", () => {
  it("keeps the same page and swaps only the subject", () => {
    expect(switchSubjectPath("/english/topics", "math")).toBe("/math/topics");
    expect(switchSubjectPath("/math/results/abc", "english")).toBe("/english/results/abc");
  });

  it("falls back to the dashboard outside the app", () => {
    expect(switchSubjectPath("/", "math")).toBe("/math/dashboard");
    expect(switchSubjectPath("/login", "english")).toBe("/english/dashboard");
  });
});
