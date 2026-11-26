import { describe, expect, it } from "vitest";
import { BACKGROUND_PRESETS, MAIN_PRESETS, backgroundVars, contrast, mainVars, userColorsCss } from "./colors";

describe("student colors", () => {
  it("is empty with GreenBook's colors", () => {
    expect(userColorsCss({ main: null, background: null })).toBe("");
    expect(userColorsCss({ main: "red", background: "#FFF" })).toBe("");
  });

  it("keeps button text and colored text readable for every preset and odd picks", () => {
    const picks = [...MAIN_PRESETS.flatMap((p) => (p.hex ? [p.hex] : [])), "#ffff00", "#000000", "#00ffff", "#ffffff"];
    for (const hex of picks) {
      for (const mode of ["light", "dark"] as const) {
        const v = mainVars(hex, mode);
        expect(contrast(v["--gb-pine"], v["--gb-pine-ink"])).toBeGreaterThanOrEqual(4.5);
        expect(contrast(v["--gb-pine"], mode === "light" ? "#ffffff" : "#0a1a0b")).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps page text readable on every background", () => {
    for (const hex of [...BACKGROUND_PRESETS.flatMap((p) => (p.hex ? [p.hex] : [])), "#ff0000", "#000000", "#ffffff"]) {
      expect(contrast(backgroundVars(hex, "light")["--gb-canvas"], "#0f1f12")).toBeGreaterThanOrEqual(10);
      expect(contrast(backgroundVars(hex, "dark")["--gb-canvas"], "#d4f7cc")).toBeGreaterThanOrEqual(10);
    }
  });

  it("writes light, dark and device-dark rules scoped to .gb-colors", () => {
    const css = userColorsCss({ main: "#1f5fae", background: null });
    expect(css).toContain(".gb-colors{--gb-pine:#1f5fae");
    expect(css).toContain('[data-theme="dark"] .gb-colors{');
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).not.toContain("--gb-canvas");
  });
});
