// Plain-word labels for the admin's Students pages. Times are shown in Tashkent time.

const TZ = "Asia/Tashkent";

/** "12h 05m", "25m", "0m". */
export function timeLabel(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

/** "68%", or "–" when nothing was answered. */
export function percent(correct: number, answered: number): string {
  return answered ? `${Math.round((correct / answered) * 100)}%` : "–";
}

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", then a date. */
export function agoLabel(iso: string | null, now = Date.now()): string {
  if (!iso) return "never";
  const diff = Math.max(0, now - new Date(iso).getTime()) / 1000;
  if (diff < 90) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return dateLabel(iso);
}

/** "27 Nov 2026". */
export function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(new Date(iso));
}

/** "27 Nov, 14:05". */
export function dateTimeLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(
    new Date(iso),
  );
}

export const SIGN_IN_LABEL = { google: "Google", code: "Class code", email: "Email link" } as const;
