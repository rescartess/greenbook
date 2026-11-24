import { describe, expect, it } from "vitest";
import { safeNextPath, HOME_AFTER_LOGIN } from "@/core/config/supabase";
import { parseLoginForm } from "./schema";

function form(values: Record<string, string>) {
  const f = new FormData();
  Object.entries(values).forEach(([k, v]) => f.set(k, v));
  return f;
}

describe("parseLoginForm", () => {
  it("accepts a normal email and tidies it", () => {
    expect(parseLoginForm(form({ email: "  Aziza@Example.com " }))).toEqual({ ok: true, email: "aziza@example.com", next: null });
  });

  it("rejects empty and broken addresses with a clear message", () => {
    expect(parseLoginForm(form({ email: "" }))).toEqual({ ok: false, message: "Enter your email address." });
    expect(parseLoginForm(form({ email: "aziza@" })).ok).toBe(false);
    expect(parseLoginForm(form({ email: "no spaces@x.com" })).ok).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps our own pages", () => {
    expect(safeNextPath("/math/topics")).toBe("/math/topics");
  });

  it("refuses other websites and falls back to the dashboard", () => {
    expect(safeNextPath("https://evil.example")).toBe(HOME_AFTER_LOGIN);
    expect(safeNextPath("//evil.example")).toBe(HOME_AFTER_LOGIN);
    expect(safeNextPath(null)).toBe(HOME_AFTER_LOGIN);
  });
});
