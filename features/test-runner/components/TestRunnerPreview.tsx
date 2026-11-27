import { notFound } from "next/navigation";
import { SUBJECTS } from "@/core/config/subjects";
import type { TestState } from "../schema";
import { TestRunner } from "./TestRunner";

const PASSAGE =
  "Many city parks now plant native grasses instead of lawns. The grasses need less water and give shelter to insects. Park staff say the change has been ______: fewer hours are spent mowing, and visitors report seeing more butterflies.";

const LONG = Array.from(
  { length: 6 },
  (_, i) =>
    `Paragraph ${i + 1}. Many city parks now plant native grasses instead of lawns. The grasses need less water, give shelter to insects and birds, and stay green through dry summers. Park staff say the change has saved money on mowing, fuel and watering, and visitors report seeing more butterflies along the paths every year.`,
).join("\n\n");

/** Made-up Math questions (math in \( \), a table, a typed answer) for checking how formulas look. */
const MATH = [
  {
    prompt:
      "\\[\\frac{3x - 5}{4} = \\frac{x + 7}{2}\\]\n\nWhat value of \\(x\\) is the solution to the given equation?",
    choices: ["\\(-19\\)", "\\(\\frac{19}{5}\\)", "\\(9\\)", "\\(19\\)"],
  },
  {
    prompt:
      "| \\(x\\) | \\(f(x)\\) |\n|---|---|\n| 0 | 12 |\n| 2 | 48 |\n| 4 | 192 |\n\nThe table shows values of the exponential function \\(f\\). Which equation defines \\(f\\)?",
    choices: ["\\(f(x) = 12(2)^{x}\\)", "\\(f(x) = 12(4)^{\\frac{x}{2}}\\)", "\\(f(x) = 4(12)^{x}\\)", "\\(f(x) = 18x + 12\\)"],
  },
  {
    prompt:
      "A circle in the \\(xy\\)-plane has equation \\((x - 3)^{2} + (y + 1)^{2} = 50\\). The point \\((a, 6)\\) lies on the circle, where \\(a > 3\\). What is the value of \\(\\sqrt{a^{2} + 2}\\)?",
    choices: [],
  },
];

/** Local-only preview of the test screen with made-up questions, for checking the design. */
export function TestRunnerPreview({ subject = "english" }: { subject?: "english" | "math" }) {
  if (process.env.NODE_ENV === "production") notFound();
  if (subject === "math") return <MathPreview />;
  const questions = Array.from({ length: 27 }, (_, i) => ({
    id: `q${i + 1}`,
    position: i + 1,
    type: "mcq" as const,
    passage: i === 0 ? LONG : PASSAGE,
    image: null,
    prompt: "Which choice completes the text with the most logical and precise word or phrase?",
    choices: [
      { id: "A", text: "worthwhile" },
      { id: "B", text: "accidental" },
      { id: "C", text: "temporary" },
      { id: "D", text: "costly" },
    ],
  }));
  const state: Extract<TestState, { status: "in_progress" }> = {
    status: "in_progress",
    attemptId: "preview",
    title: "Practice test 1",
    subject: "english",
    module: {
      attemptModuleId: "preview-m1",
      number: 1,
      // eslint-disable-next-line react-hooks/purity -- local preview only
      deadlineAt: new Date(Date.now() + 31 * 60_000 + 49_000).toISOString(),
      serverNow: new Date().toISOString(),
      isLast: false,
    },
    questions,
    responses: { q2: { answer: "A", marked: true, eliminated: [] } },
  };
  return (
    <TestRunner
      state={state}
      sectionName={SUBJECTS.english.name}
      studentName="Aziza Karimova"
      resultsHref="/dev/exam"
      tools={SUBJECTS.english.tools}
      sectionNumber={SUBJECTS.english.sectionNumber}
      directions={SUBJECTS.english.directions}
      exitHref="/dev/exam"
    />
  );
}

function MathPreview() {
  const questions = Array.from({ length: 22 }, (_, i) => {
    const q = MATH[i % MATH.length];
    return {
      id: `m${i + 1}`,
      position: i + 1,
      type: q.choices.length ? ("mcq" as const) : ("spr" as const),
      passage: null,
      image: null,
      prompt: q.prompt,
      choices: q.choices.map((text, j) => ({ id: "ABCD"[j], text })),
    };
  });
  const state: Extract<TestState, { status: "in_progress" }> = {
    status: "in_progress",
    attemptId: "preview-math",
    title: "Practice test 1",
    subject: "math",
    module: {
      attemptModuleId: "preview-math-m1",
      number: 1,
      // eslint-disable-next-line react-hooks/purity -- local preview only
      deadlineAt: new Date(Date.now() + 34 * 60_000).toISOString(),
      serverNow: new Date().toISOString(),
      isLast: false,
    },
    questions,
    responses: {},
  };
  return (
    <TestRunner
      state={state}
      sectionName={SUBJECTS.math.name}
      studentName="Aziza Karimova"
      resultsHref="/dev/exam/math"
      tools={SUBJECTS.math.tools}
      sectionNumber={SUBJECTS.math.sectionNumber}
      directions={SUBJECTS.math.directions}
      exitHref="/dev/exam/math"
    />
  );
}
