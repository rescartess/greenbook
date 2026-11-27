/** Rules for what a student can change on their profile. */
export const NAME_MAX = 40;
export const TARGET_MIN = 400;
export const TARGET_MAX = 1600;

export type ProfileFormState = { ok: boolean; message: string | null };

/** A name to show in the menu and on the test screen: 1 to 40 characters, spaces tidied. */
export function parseName(raw: unknown): { ok: true; name: string } | { ok: false; message: string } {
  const name = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!name) return { ok: false, message: "Type a name." };
  if (name.length > NAME_MAX) return { ok: false, message: `Use ${NAME_MAX} characters or fewer.` };
  return { ok: true, name };
}

/** A target SAT total from 400 to 1600, in steps of 10. Empty clears it. */
export function parseTarget(raw: unknown): { ok: true; target: number | null } | { ok: false; message: string } {
  const text = String(raw ?? "").trim();
  if (!text) return { ok: true, target: null };
  const n = Number(text);
  if (!Number.isInteger(n) || n < TARGET_MIN || n > TARGET_MAX || n % 10 !== 0) {
    return { ok: false, message: `Use a total from ${TARGET_MIN} to ${TARGET_MAX}, in steps of 10.` };
  }
  return { ok: true, target: n };
}

/** The last 7 days, oldest first, as YYYY-MM-DD in the student's time zone order (UTC dates). */
export function lastSevenDays(now: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

/** A color from the picker: '#rrggbb' (lower case) or null for RainbowPrep's own. */
export function parseColor(raw: unknown): { ok: true; color: string | null } | { ok: false } {
  const text = String(raw ?? "").trim().toLowerCase();
  if (!text) return { ok: true, color: null };
  return /^#[0-9a-f]{6}$/.test(text) ? { ok: true, color: text } : { ok: false };
}

/** The SAT date: YYYY-MM-DD between 2024 and 2035, or empty to clear it. */
export function parseTestDate(raw: unknown): { ok: true; date: string | null } | { ok: false; message: string } {
  const text = String(raw ?? "").trim();
  if (!text) return { ok: true, date: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`)) || text < "2024-01-01" || text > "2035-12-31") {
    return { ok: false, message: "Pick a date between 2024 and 2035." };
  }
  return { ok: true, date: text };
}

/** Whole days from `today` (YYYY-MM-DD) to `date`; negative once it has passed. */
export function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
}

export const BIO_MAX = 160;

/** A bio of up to 160 characters, spaces tidied; empty clears it. */
export function parseBio(raw: unknown): { ok: true; bio: string | null } | { ok: false; message: string } {
  const bio = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!bio) return { ok: true, bio: null };
  if (bio.length > BIO_MAX) return { ok: false, message: `Use ${BIO_MAX} characters or fewer.` };
  return { ok: true, bio };
}
