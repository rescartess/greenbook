/** "64:29:44" (hours can pass 99), like a stopwatch. */
export function practiceTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st... */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const suffix: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };
  return `${n}${suffix[n % 10] ?? "th"}`;
}

/** "Top 7%" style: the share of students at or above this rank, at least 1%. */
export function topPercent(rank: number, students: number): number {
  return Math.max(1, Math.min(100, Math.ceil((rank / Math.max(1, students)) * 100)));
}
