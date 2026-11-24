import type { SubjectSlug } from "@/core/config/subjects";

/**
 * How many questions each subject has waiting in Mistakes (shown as a badge on the tab).
 * SAMPLE until milestone 10 reads question_progress.
 */
export async function getMistakeCounts(): Promise<Record<SubjectSlug, number>> {
  return { english: 23, math: 17 };
}
