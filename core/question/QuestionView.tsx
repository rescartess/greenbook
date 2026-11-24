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
  /** The student's pick (test screen) — shown with the pine outline. */
  selectedId?: string | null;
  /** Reveal the right answer (admin preview, review after a test). */
  correctId?: string | null;
  className?: string;
};

/**
 * The Bluebook-style question: passage on the left, question and choices on the right.
 * Stacks when its space is narrow (phones, side-by-side previews). Has no buttons or state of its own, so the test screen,
 * practice and the admin preview can all wrap it.
 */
export function QuestionView({
  number,
  question,
  selectedId,
  correctId,
  className,
}: Props) {
  const hasPassage = Boolean(question.passage?.trim());

  return (
    <div className={cn("@container", className)}>
      <div className={cn("grid", hasPassage && "@2xl:grid-cols-2")}>
        {hasPassage ? (
          <div className="border-hairline px-6 py-7 text-[17px] leading-[1.75] @2xl:border-r @2xl:px-10 @2xl:py-9">
            <RichText source={question.passage!} />
          </div>
        ) : null}

        <div
          className={cn(
            "flex flex-col gap-5 px-6 py-7 @2xl:px-10 @2xl:py-9",
            !hasPassage && "mx-auto w-full max-w-2xl",
          )}
        >
          <div className="flex items-center gap-3.5 border-b border-dashed border-control pb-3.5">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-ink px-1.5 text-sm font-bold text-paper tabular-nums">
              {number}
            </span>
          </div>

          <RichText
            source={question.prompt}
            className="text-[17px] leading-relaxed"
          />

          <ol className="flex flex-col gap-2.5" aria-label="Answer choices">
            {question.choices.map((choice) => {
              const isCorrect = correctId === choice.id;
              const isSelected = selectedId === choice.id;
              const strong = isCorrect || isSelected;
              return (
                <li
                  key={choice.id}
                  className={cn(
                    "flex items-start gap-3.5 rounded-choice px-4 py-3 text-base leading-snug",
                    strong
                      ? "border-2 border-pine bg-pine-tint"
                      : "border-[1.5px] border-control bg-paper",
                  )}
                >
                  <span
                    className={cn(
                      "mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      strong
                        ? "bg-pine text-pine-ink"
                        : "border-[1.5px] border-ink",
                    )}
                  >
                    {choice.id}
                  </span>
                  <span className="pt-0.5">
                    <RichLine source={choice.text} />
                  </span>
                  {isCorrect ? (
                    <span className="sr-only shrink-0 pt-0.5 text-sm font-bold text-pine @md:not-sr-only @md:ml-auto">
                      Correct
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
