import { notFound } from "next/navigation";

/**
 * The two SAT subjects. Everything subject-specific (names, timing, tools,
 * content areas) lives here, so changing test timing or adding a tool is a
 * config change, not a code change.
 */

export type SubjectSlug = "english" | "math";

export type Subject = {
  slug: SubjectSlug;
  /** Short label used on the switch. */
  label: string;
  /** Full section name used in headings. */
  name: string;
  modules: number;
  questionsPerModule: number;
  minutesPerModule: number;
  tools: ReadonlyArray<"annotate" | "calculator" | "reference">;
  /** The four official content areas, in College Board order. */
  domains: readonly string[];
};

export const SUBJECTS: Record<SubjectSlug, Subject> = {
  english: {
    slug: "english",
    label: "English",
    name: "Reading and Writing",
    modules: 2,
    questionsPerModule: 27,
    minutesPerModule: 32,
    tools: ["annotate"],
    domains: [
      "Information and Ideas",
      "Craft and Structure",
      "Expression of Ideas",
      "Standard English Conventions",
    ],
  },
  math: {
    slug: "math",
    label: "Math",
    name: "Math",
    modules: 2,
    questionsPerModule: 22,
    minutesPerModule: 35,
    tools: ["calculator", "reference"],
    domains: [
      "Algebra",
      "Advanced Math",
      "Problem-Solving and Data Analysis",
      "Geometry and Trigonometry",
    ],
  },
};

export const SUBJECT_SLUGS = Object.keys(SUBJECTS) as SubjectSlug[];

export function isSubjectSlug(value: string): value is SubjectSlug {
  return value in SUBJECTS;
}

/** Swap the subject segment of a path: /english/topics -> /math/topics. */
export function switchSubjectPath(pathname: string, to: SubjectSlug): string {
  const parts = pathname.split("/");
  if (parts.length > 1 && isSubjectSlug(parts[1])) {
    parts[1] = to;
    return parts.join("/");
  }
  return `/${to}/dashboard`;
}

/** For pages: turn the URL segment into a subject, or show "not found". */
export function requireSubject(value: string): SubjectSlug {
  if (isSubjectSlug(value)) return value;
  notFound();
}
