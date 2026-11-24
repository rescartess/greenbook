import type { FeatureKey } from "@/core/config/features";
import type { SubjectSlug } from "@/core/config/subjects";

/** What the app shell needs to know about the signed-in student. */
export type ShellUser = { name: string; initials: string };

/** Small counts on side tabs, per subject (e.g. mistakes waiting). */
export type ShellBadges = Partial<Record<SubjectSlug, Partial<Record<FeatureKey, number>>>>;
