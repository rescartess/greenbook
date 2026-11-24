import type { SubjectSlug } from "@/core/config/subjects";
import { SUBJECTS } from "@/core/config/subjects";

export type DashboardData = {
  resume: { title: string; detail: string; progress: number; href: string } | null;
  score: { value: number; changeSinceFirst: number; trend: number[]; detail: string } | null;
  domains: { name: string; accuracy: number }[];
  next: { title: string; detail: string; href: string; primary?: boolean }[];
  mistakeCount: number;
};

/**
 * Everything the dashboard shows for one subject.
 * SAMPLE numbers until milestones 8-12 connect real attempts and progress.
 */
export async function getDashboard(subject: SubjectSlug): Promise<DashboardData> {
  const english = subject === "english";
  const accuracy = english ? [78, 64, 82, 71] : [86, 69, 81, 58];
  return {
    resume: {
      title: english ? "Full test 3, module 2" : "Full test 2, module 1",
      detail: english ? "18 of 27 answered, 12:40 left" : "9 of 22 answered, 21:05 left",
      progress: english ? 18 / 27 : 9 / 22,
      href: `/${subject}/full-tests`,
    },
    score: {
      value: english ? 680 : 710,
      changeSinceFirst: english ? 40 : 60,
      trend: english ? [640, 650, 640, 670, 680] : [650, 660, 690, 700, 710],
      detail: english
        ? "Full test 2, 12 November. Estimated, not an official score."
        : "Full test 1, 15 November. Estimated, not an official score.",
    },
    domains: SUBJECTS[subject].domains.map((name, i) => ({ name, accuracy: accuracy[i] })),
    next: [
      {
        title: english ? "Words in context, set 2" : "Circles, set 1",
        detail: "Your weakest area, 10 questions",
        href: `/${subject}/topics`,
        primary: true,
      },
      { title: "Review mistakes", detail: `${english ? 23 : 17} questions waiting`, href: `/${subject}/mistakes` },
      { title: "November questions", detail: "New this month", href: `/${subject}/monthly` },
    ],
    mistakeCount: english ? 23 : 17,
  };
}
