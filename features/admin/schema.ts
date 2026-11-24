/** Small helpers for admin pages: labels and input checks. */

export function moduleLabel(moduleNumber: number, tier: string): string {
  if (moduleNumber === 1) return "Module 1";
  if (tier === "harder") return "Module 2 (harder)";
  if (tier === "easier") return "Module 2 (easier)";
  return "Module 2";
}

export function difficultyLabel(difficulty: string): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export function statusLabel(status: string): string {
  return status === "published" ? "Published" : status === "retired" ? "Retired" : "Draft";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID.test(value);

/** Question ids look like eng-pt1-m1-q01. */
export const isExternalId = (value: string) => /^[a-z0-9-]{3,64}$/.test(value);

/** A short one-line preview of long text. */
export function shorten(text: string, max = 110): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}
