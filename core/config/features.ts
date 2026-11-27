/**
 * Feature switches and the side-tab order.
 *
 * - Add a feature: add one line here, one folder in features/, one page in app/.
 * - Hide a feature (unfinished or broken): set `enabled: false`. Its tab
 *   disappears and its page shows "not found", without touching any code.
 */

export type FeatureKey =
  | "dashboard"
  | "full-tests"
  | "topics"
  | "monthly"
  | "results"
  | "mistakes";

export type IconName =
  | "dashboard"
  | "tests"
  | "topics"
  | "calendar"
  | "results"
  | "bookmark";

export type FeatureEntry = {
  key: FeatureKey;
  label: string;
  /** One short word for the phone tab bar. */
  shortLabel: string;
  /** Path after /{subject}/ */
  path: string;
  icon: IconName;
  enabled: boolean;
};

export const FEATURES: readonly FeatureEntry[] = [
  { key: "dashboard", label: "Dashboard", shortLabel: "Home", path: "dashboard", icon: "dashboard", enabled: true },
  { key: "full-tests", label: "Full tests", shortLabel: "Tests", path: "full-tests", icon: "tests", enabled: true },
  { key: "topics", label: "Topics", shortLabel: "Topics", path: "topics", icon: "topics", enabled: true },
  { key: "monthly", label: "By month", shortLabel: "Months", path: "monthly", icon: "calendar", enabled: false },
  { key: "results", label: "Results", shortLabel: "Results", path: "results", icon: "results", enabled: true },
  { key: "mistakes", label: "Mistakes", shortLabel: "Mistakes", path: "mistakes", icon: "bookmark", enabled: true },
];

export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES.some((f) => f.key === key && f.enabled);
}

export const ENABLED_FEATURES = FEATURES.filter((f) => f.enabled);
