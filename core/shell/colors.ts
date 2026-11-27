/**
 * The student's own site colors (profile settings, migration 0020). Two colors only:
 * - main: buttons, selected tabs, progress bars and scores (replaces pine)
 * - background: the page behind the cards (tints the canvas)
 * They apply inside `.gb-colors` (the logged-in shell and admin), never on the test or practice screens.
 * Every value is adjusted per mode so text stays readable in light and dark.
 */

export type UserColors = { main: string | null; background: string | null };

/** Choices offered first; anything else comes from the color picker. Light-mode values. */
export const MAIN_PRESETS = [
  { name: "Design", hex: null },
  { name: "Ocean", hex: "#1f5fae" },
  { name: "Indigo", hex: "#4338ca" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Rose", hex: "#be185d" },
  { name: "Brick", hex: "#b4432a" },
  { name: "Amber", hex: "#a16207" },
  { name: "Teal", hex: "#0f766e" },
  { name: "Graphite", hex: "#3f4447" },
] as const;

export const BACKGROUND_PRESETS = [
  { name: "Design", hex: null },
  { name: "Sand", hex: "#efe4cf" },
  { name: "Sky", hex: "#dbe8f7" },
  { name: "Mint", hex: "#d8efe3" },
  { name: "Lavender", hex: "#e6e0f5" },
  { name: "Blush", hex: "#f5dfe3" },
  { name: "Slate", hex: "#dfe3e8" },
  { name: "Butter", hex: "#f6efc9" },
] as const;

/** The Default design's values for the swatches (same as the .gb-colors block in app/globals.css). */
export const DEFAULT_MAIN = "#2e46b8";
export const DEFAULT_BACKGROUND = "#f4f6fa";

const LIGHT = { paper: "#ffffff", canvas: "#f4f6fa", text: "#1b1d22" };
const DARK = { paper: "#131a2a", canvas: "#0b101c", text: "#e9edf6" };

export const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/.test(v);

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const hexOf = (c: number[]) => `#${c.map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, "0")).join("")}`;

/** `amount` of `b` mixed into `a` (0 = a, 1 = b). */
export function mix(a: string, b: string, amount: number): string {
  const [x, y] = [rgb(a), rgb(b)];
  return hexOf(x.map((v, i) => v + (y[i] - v) * amount));
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Moves `color` toward `toward` until it reaches `ratio` contrast with `against`. */
function untilReadable(color: string, against: string, toward: string, ratio: number): string {
  let c = color;
  for (let i = 0; i < 12 && contrast(c, against) < ratio; i++) c = mix(c, toward, 0.15);
  return c;
}

type Vars = Record<string, string>;

export function mainVars(main: string, mode: "light" | "dark"): Vars {
  const base = mode === "light" ? LIGHT : DARK;
  const pine = mode === "light" ? untilReadable(main, base.paper, "#000000", 4.5) : untilReadable(main, base.paper, "#ffffff", 5);
  const ink = contrast("#ffffff", pine) >= contrast(DARK.paper, pine) ? "#ffffff" : DARK.paper;
  return {
    "--gb-pine": pine,
    "--gb-pine-ink": ink,
    "--gb-pine-soft": mix(pine, base.paper, 0.5),
    "--gb-pine-tint": mix(pine, base.paper, mode === "light" ? 0.9 : 0.82),
  };
}

export function backgroundVars(background: string, mode: "light" | "dark"): Vars {
  const base = mode === "light" ? LIGHT : DARK;
  let canvas = mix(base.canvas, background, mode === "light" ? 0.7 : 0.2);
  canvas = untilReadable(canvas, base.text, mode === "light" ? "#ffffff" : "#000000", 10);
  return { "--gb-canvas": canvas };
}

const block = (selector: string, vars: Vars) =>
  `${selector}{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")}}`;

/**
 * The CSS for the student's colors, scoped to `.gb-colors` in the Default design only (owner rule,
 * 27 Nov 2026: Strawberry, Premium and Nerd are fixed by us; picking a color switches to Default).
 * Empty when they use the design's colors.
 */
export function userColorsCss({ main, background }: UserColors): string {
  const m = isHex(main) ? main : null;
  const b = isHex(background) ? background : null;
  if (!m && !b) return "";
  const forMode = (mode: "light" | "dark") => ({ ...(m ? mainVars(m, mode) : {}), ...(b ? backgroundVars(b, mode) : {}) });
  return [
    block("html:not([data-design]) .gb-colors", forMode("light")),
    block('html[data-theme="dark"]:not([data-design]) .gb-colors', forMode("dark")),
    `@media (prefers-color-scheme: dark){${block('html:not([data-theme="light"]):not([data-design]) .gb-colors', forMode("dark"))}}`,
  ].join("");
}

export const USER_COLORS_STYLE_ID = "gb-user-colors";
