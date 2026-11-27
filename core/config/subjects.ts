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
  /** Each area's share of a real test (College Board's test specifications), shown on the results page. */
  domainShares: Readonly<Record<string, string>>;
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
      "This section tests key reading and writing skills. Every question comes with one or more passages, and some passages include a table or graph. Read each passage and question carefully, then choose the answer that the passage(s) best support.",
      "Every question in this section is multiple-choice with four answer choices, and each question has one best answer.",
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
    domainShares: {
      "Information and Ideas": "26% of test section, 12–14 questions",
      "Craft and Structure": "28% of test section, 13–15 questions",
      "Expression of Ideas": "20% of test section, 8–12 questions",
      "Standard English Conventions": "26% of test section, 11–15 questions",
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
    domainShares: {
      Algebra: "35% of test section, 13–15 questions",
      "Advanced Math": "35% of test section, 13–15 questions",
      "Problem-Solving and Data Analysis": "15% of test section, 5–7 questions",
      "Geometry and Trigonometry": "15% of test section, 5–7 questions",
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

/** Which SAT domain each skill (topic) belongs to, for the Domain column of the question overview. */
export const SKILL_DOMAIN: Record<string, string> = {
  "Central Ideas and Details": "Information and Ideas",
  "Command of Evidence": "Information and Ideas",
  Inferences: "Information and Ideas",
  "Words in Context": "Craft and Structure",
  "Text Structure and Purpose": "Craft and Structure",
  "Cross-Text Connections": "Craft and Structure",
  "Rhetorical Synthesis": "Expression of Ideas",
  Transitions: "Expression of Ideas",
  Boundaries: "Standard English Conventions",
  "Form, Structure, and Sense": "Standard English Conventions",
  "Linear Equations in One Variable": "Algebra",
  "Linear Equations in Two Variables": "Algebra",
  "Linear Functions": "Algebra",
  "Systems of Two Linear Equations in Two Variables": "Algebra",
  "Linear Inequalities in One or Two Variables": "Algebra",
  "Nonlinear Functions": "Advanced Math",
  "Nonlinear Equations in One Variable and Systems of Equations in Two Variables": "Advanced Math",
  "Equivalent Expressions": "Advanced Math",
  Percentages: "Problem-Solving and Data Analysis",
  "Ratios, Rates, Proportional Relationships, and Units": "Problem-Solving and Data Analysis",
  "One-Variable Data: Distributions and Measures of Center and Spread": "Problem-Solving and Data Analysis",
  "Two-Variable Data: Models and Scatterplots": "Problem-Solving and Data Analysis",
  "Probability and Conditional Probability": "Problem-Solving and Data Analysis",
  "Inference from Sample Statistics and Margin of Error": "Problem-Solving and Data Analysis",
  "Evaluating Statistical Claims: Observational Studies and Experiments": "Problem-Solving and Data Analysis",
  "Area and Volume": "Geometry and Trigonometry",
  "Lines, Angles, and Triangles": "Geometry and Trigonometry",
  "Right Triangles and Trigonometry": "Geometry and Trigonometry",
  Circles: "Geometry and Trigonometry",
};

const DOMAIN_BY_LOWER = new Map(Object.entries(SKILL_DOMAIN).map(([k, v]) => [k.toLowerCase(), v]));

/** The SAT domain of a skill or topic name, whatever its capitals ("Linear functions" = "Linear Functions"). */
export function skillDomain(name: string | null | undefined): string | null {
  return name ? (DOMAIN_BY_LOWER.get(name.trim().toLowerCase()) ?? null) : null;
}
