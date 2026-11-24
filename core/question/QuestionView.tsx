import type { ReactNode } from "react";
import { cn } from "@/core/design/ui";
import type { QuestionChoice } from "./choices";
import { RichLine, RichText } from "./RichText";

export type QuestionContent = {
  passage: string | null;
  prompt: string;
  choices: QuestionChoice[];
};

type Props = {
  number: number;
  question: QuestionContent;
  /** The student's pick. */
  selectedId?: string | null;
  /** Reveal the right answer (admin preview, review after a test). */
  correctId?: string | null;
  /** Choices the student crossed out. */
  eliminated?: readonly string[];
  /** Makes the choices clickable (test screen, practice). */
  onChoose?: (id: string) => void;
  /** Shows a cross-out button next to each choice. */
  onToggleEliminate?: (id: string) => void;
  /** Extra controls in the question's top bar, e.g. "Mark for review". */
  headerExtra?: ReactNode;
  /** Replaces the choice list, e.g. a typed-answer box for Math. */
  answerSlot?: ReactNode;
  className?: string;
};

/**
 * The Bluebook-style question: passage on the left, question and choices on the right.
 * Stacks when its space is narrow (phones, side-by-side previews). Keeps no state:
 * the test screen, practice, results and the admin preview pass in what to show.
 */
export function QuestionView({
  number,
  question,
  selectedId,
  correctId,
  eliminated = [],
  onChoose,
  onToggleEliminate,
  headerExtra,
  answerSlot,
  className,
}: Props) {
  const hasPassage = Boolean(question.passage?.trim());
  const reviewing = Boolean(correctId);

  return (
    <div className={cn("@container", className)}>
      <div className={cn("grid", hasPassage && "@2xl:grid-cols-2")}>
        {hasPassage ? (
          <div className="border-hairline px-6 py-7 text-[17px] leading-[1.75] @2xl:border-r @2xl:px-10 @2xl:py-9">
            <RichText source={question.passage!} />
          </div>
        ) : null}

        <div className={cn("flex flex-col gap-5 px-6 py-7 @2xl:px-10 @2xl:py-9", !hasPassage && "mx-auto w-full max-w-2xl")}>
          <div className="flex min-h-10 items-center gap-3.5 border-b border-dashed border-control pb-3">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-ink px-1.5 text-sm font-bold text-paper tabular-nums">
              {number}
            </span>
            {headerExtra}
          </div>

          <RichText source={question.prompt} className="text-[17px] leading-relaxed" />

          {answerSlot ?? (
            <div role={onChoose ? "radiogroup" : "list"} aria-label="Answer choices" className="flex flex-col gap-2.5">
              {question.choices.map((choice) => {
                const isCorrect = correctId === choice.id;
                const isSelected = selectedId === choice.id;
                const isWrongPick = reviewing && isSelected && !isCorrect;
                const isOut = eliminated.includes(choice.id) && !isSelected;
                const strong = isCorrect || (isSelected && !reviewing);

                const body = (
                  <>
                    <span
                      className={cn(
                        "mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        strong ? "bg-pine text-pine-ink" : isWrongPick ? "bg-ink text-paper" : "border-[1.5px] border-ink",
                      )}
                    >
                      {choice.id}
                    </span>
                    <span className={cn("pt-0.5 text-left", isOut && "text-graphite line-through decoration-ink/60")}>
                      <RichLine source={choice.text} />
                    </span>
                    {isCorrect || isWrongPick ? (
                      <span
                        className={cn(
                          "sr-only shrink-0 pt-0.5 text-sm font-bold @md:not-sr-only @md:ml-auto",
                          isCorrect ? "text-pine" : "text-ink",
                        )}
                      >
                        {isCorrect ? (isSelected ? "Your answer, correct" : "Correct") : "Your answer"}
                      </span>
                    ) : null}
                  </>
                );

                const boxClass = cn(
                  "flex flex-1 items-start gap-3.5 rounded-choice px-4 py-3 text-base leading-snug",
                  strong
                    ? "border-2 border-pine bg-pine-tint"
                    : isWrongPick
                      ? "border-2 border-ink bg-wash"
                      : "border-[1.5px] border-control bg-paper",
                  isOut && "opacity-60",
                );

                return (
                  <div key={choice.id} role={onChoose ? undefined : "listitem"} className="flex items-stretch gap-2">
                    {onChoose ? (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onChoose(choice.id)}
                        className={cn(boxClass, "transition-colors", !strong && "hover:border-ink-soft")}
                      >
                        {body}
                      </button>
                    ) : (
                      <div className={boxClass}>{body}</div>
                    )}
                    {onToggleEliminate ? (
                      <button
                        type="button"
                        onClick={() => onToggleEliminate(choice.id)}
                        aria-pressed={isOut}
                        aria-label={isOut ? `Bring back choice ${choice.id}` : `Cross out choice ${choice.id}`}
                        className="flex w-10 shrink-0 items-center justify-center rounded-choice text-sm font-bold text-graphite hover:bg-wash"
                      >
                        <span className={cn("relative", !isOut && "line-through decoration-2")}>{isOut ? "Undo" : choice.id}</span>
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
