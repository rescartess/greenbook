import { notFound } from "next/navigation";
import type { PracticeQuestion, PracticeState } from "../schema";
import { FinishedFrame } from "./PracticePage";
import { PracticeResults } from "./PracticeResults";

/** Local-only preview of a finished practice with made-up questions. */
export function PracticeResultsPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const questions: PracticeQuestion[] = Array.from({ length: 23 }, (_, i) => {
    const answer = i % 7 === 6 ? null : i % 3 === 0 ? "B" : "A";
    return {
      id: `q${i}`, position: i + 1, type: "mcq", passage: "A made-up passage for the preview.", image: null,
      prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
      choices: [{ id: "A", text: "first" }, { id: "B", text: "second" }, { id: "C", text: "third" }, { id: "D", text: "fourth" }] as PracticeQuestion["choices"],
      skill: i < 12 ? "Boundaries" : "Transitions", difficulty: "hard", answer, marked: false, eliminated: [],
      feedback: { answer, isCorrect: answer === "A", correctAnswer: "A", explanation: null },
    };
  });
  const state: PracticeState = {
    attemptId: "a", attemptModuleId: "m", status: "completed", setId: "s", kind: "topic", title: "Boundaries", subject: "english",
    checkMode: "end", options: { difficulty: "hard", from: 1, to: 23, minutes: null }, deadlineAt: null, serverNow: "2026-11-27T00:00:00Z",
    moreAfter: 14, questions,
  };
  return (
    <FinishedFrame subject="english">
      <PracticeResults state={state} studentName="Aziza Karimova" backHref="/english/results" backLabel="All results" />
    </FinishedFrame>
  );
}
