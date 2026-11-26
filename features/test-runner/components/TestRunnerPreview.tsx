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

/** Local-only preview of the test screen with made-up questions, for checking the design. */
export function TestRunnerPreview() {
  if (process.env.NODE_ENV === "production") notFound();
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
