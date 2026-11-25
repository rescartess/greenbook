"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button, cn } from "@/core/design/ui";
import type { QuestionChoice } from "./choices";
import { QuestionView } from "./QuestionView";
import { RichText } from "./RichText";

export type CheckFeedback = {
  answer: string | null;
  isCorrect: boolean;
  correctAnswer: string | null;
  explanation: string | null;
};

type Props = {
  number: number;
  question: { passage: string | null; image?: string | null; prompt: string; choices: QuestionChoice[]; type?: string };
  /** Feedback already given earlier (e.g. after reloading the page). */
  initialFeedback?: CheckFeedback | null;
  /** Sends the answer to the server and returns its verdict. Throw to show an error. */
  onCheck: (answer: string) => Promise<CheckFeedback>;
  /** Shown under the feedback, e.g. a Next button. */
  after?: (feedback: CheckFeedback) => ReactNode;
  className?: string;
};

/** Answer a question, check it right away, see why. Used by practice and by Mistakes. */
export function AnswerCheck({ number, question, initialFeedback = null, onCheck, after, className }: Props) {
  const [picked, setPicked] = useState<string | null>(initialFeedback?.answer ?? null);
  const [typed, setTyped] = useState(initialFeedback?.answer ?? "");
  const [feedback, setFeedback] = useState<CheckFeedback | null>(initialFeedback);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const typedAnswer = question.type === "spr";
  const answer = typedAnswer ? typed.trim() : picked;

  const check = () => {
    if (!answer) return;
    setError(null);
    start(async () => {
      try {
        setFeedback(await onCheck(answer));
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn’t work. Try again.");
      }
    });
  };

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-card border border-hairline bg-paper">
        <QuestionView
          number={number}
          question={question}
          selectedId={feedback ? feedback.answer : picked}
          correctId={feedback?.correctAnswer ?? null}
          onChoose={feedback || typedAnswer ? undefined : setPicked}
          answerSlot={
            typedAnswer ? (
              <label className="flex max-w-xs flex-col gap-2">
                <span className="text-[15px] font-bold">Your answer</span>
                <input
                  value={typed}
                  disabled={Boolean(feedback)}
                  inputMode="decimal"
                  maxLength={6}
                  onChange={(e) => setTyped(e.target.value.replace(/[^0-9./-]/g, ""))}
                  className="rounded-choice border-[1.5px] border-control bg-paper px-4 py-3 text-lg tabular-nums outline-none focus:border-pine"
                />
                {feedback ? (
                  <span className="text-[15px]">
                    Correct answer: <strong>{feedback.correctAnswer}</strong>
                  </span>
                ) : null}
              </label>
            ) : undefined
          }
        />
      </div>

      {feedback ? (
        <div
          className={cn(
            "mt-4 rounded-panel border px-6 py-5",
            feedback.isCorrect ? "border-pine bg-pine-tint" : "border-hairline bg-paper",
          )}
          aria-live="polite"
        >
          <p className={cn("text-lg font-extrabold", feedback.isCorrect && "text-pine")}>
            {feedback.isCorrect ? "Correct" : `Not quite. The answer is ${feedback.correctAnswer}.`}
          </p>
          {feedback.explanation ? (
            <RichText source={feedback.explanation} className="mt-1.5 text-[15px] leading-relaxed text-ink-soft" />
          ) : null}
          {after ? <div className="mt-4">{after(feedback)}</div> : null}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={check} disabled={!answer || pending}>
            {pending ? "Checking…" : "Check answer"}
          </Button>
          {error ? (
            <span role="alert" className="text-[15px] font-semibold">
              {error}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
