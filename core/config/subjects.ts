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
  /** One plain line per content area, shown on the results page. */
  domainNotes: Readonly<Record<string, string>>;
  /** Section number on the test screen (Reading and Writing comes first). */
  sectionNumber: number;
  /** Shown under "Directions" on the test screen. */
  directions: readonly string[];
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
    sectionNumber: 1,
    directions: [
      "Each question has a short passage, sometimes with a table or two texts, and four answer choices. Pick the one best answer.",
      "You can move between questions and change your answers until the module ends. Unanswered questions count as wrong, so answer every one.",
      "Use Highlight to mark words in a passage, ABC to cross out choices you’ve ruled out, and Mark for Review to find a question again later.",
    ],
    domains: [
      "Information and Ideas",
      "Craft and Structure",
      "Expression of Ideas",
      "Standard English Conventions",
    ],
    domainNotes: {
      "Information and Ideas": "Understanding what a text says and using evidence.",
      "Craft and Structure": "Word meaning in context and how a text is built.",
      "Expression of Ideas": "Revising writing so it is clearer and more effective.",
      "Standard English Conventions": "Grammar, punctuation and sentence structure.",
    },
  },
  math: {
    slug: "math",
    label: "Math",
    name: "Math",
    modules: 2,
    questionsPerModule: 22,
    minutesPerModule: 35,
    tools: ["calculator", "reference"],
    sectionNumber: 2,
    directions: [
      "Most questions have four answer choices; pick the one best answer. For the others, type your answer in the box.",
      "Typed answers: up to 5 characters for a positive answer and 6 for a negative one. Fractions like 3/4 and decimals like 0.75 are both fine. If there are several right answers, enter one.",
      "Reference has the formulas you may need. You can move between questions and change answers until the module ends. Unanswered questions count as wrong.",
    ],
    domains: [
      "Algebra",
      "Advanced Math",
      "Problem-Solving and Data Analysis",
      "Geometry and Trigonometry",
    ],
    domainNotes: {
      Algebra: "Linear equations, systems and inequalities.",
      "Advanced Math": "Quadratics, exponentials and other nonlinear functions.",
      "Problem-Solving and Data Analysis": "Ratios, percentages, probability and data.",
      "Geometry and Trigonometry": "Area, volume, angles, circles and trigonometry.",
    },
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

/**
 * Scores come from estimated tables until the owner adds real ones
 * (supabase/migrations/..._estimated_scores.sql). While true, every score says "estimated".
 */
export const ESTIMATED_SCORES = true;
