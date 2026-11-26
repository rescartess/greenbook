import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { cn } from "@/core/design/ui";
import type { QuestionChoice } from "./choices";
import { questionImageUrl } from "./image";
import { RichLine, RichText } from "./RichText";

export type QuestionContent = {
  passage: string | null;
  /** A table or graph shown above the passage (stored path, see image.ts). */
  image?: string | null;
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
  /** In review with the right answer hidden: colour the student's pick green (right) or red (wrong). */
  pickVerdict?: "right" | "wrong" | null;
  /** Choices the student crossed out. */
  eliminated?: readonly string[];
  /** Makes the choices clickable (test screen, practice). */
  onChoose?: (id: string) => void;
  /** Shows a round cross-out button next to each choice. */
  onToggleEliminate?: (id: string) => void;
  /** Controls in the grey question bar after the number, e.g. "Mark for Review". */
  headerExtra?: ReactNode;
  /** Controls at the right end of the grey question bar, e.g. the ABC cross-out switch. */
  headerRight?: ReactNode;
  /** Replaces the choice list, e.g. a typed-answer box for Math. */
  answerSlot?: ReactNode;
  /** Passage width in percent on wide screens (default 50). */
  passageWidth?: number;
  /** When given, the divider between passage and question can be dragged. */
  onResize?: (percent: number) => void;
  /** Stretch to the screen height between the test bars, so the divider runs top to bottom. */
  fillHeight?: boolean;
  className?: string;
};

const clamp = (n: number) => Math.min(75, Math.max(25, n));

/**
 * The Bluebook-style question: passage on the left, a divider, the question and choices on the right.
 * Test text is set in a serif, like the real test. Stacks when its space is narrow.
 * Keeps no state: the test screen, practice, results and the admin preview pass in what to show.
 */
export function QuestionView({
  number,
  question,
  selectedId,
  correctId,
  pickVerdict,
  eliminated = [],
  onChoose,
  onToggleEliminate,
  headerExtra,
  headerRight,
  answerSlot,
  passageWidth = 50,
  onResize,
  fillHeight,
  className,
}: Props) {
  const hasPassage = Boolean(question.passage?.trim() || question.image);
  const reviewing = Boolean(correctId);

  const drag = (e: PointerEvent<HTMLDivElement>) => {
    if (!onResize || e.buttons !== 1) return;
    const box = e.currentTarget.parentElement?.getBoundingClientRect();
    if (box) onResize(clamp(((e.clientX - box.left) / box.width) * 100));
  };

  return (
    <div className={cn("@container font-serif", className)}>
      <div
        className={cn(
          "flex flex-col",
          hasPassage && "@2xl:flex-row",
          // Between the exam bars (87px top, 79px bottom): passage and question scroll on their own, like Bluebook.
          fillHeight && "@2xl:h-[calc(100dvh-166px)]",
        )}
        style={{ "--pw": `${passageWidth}%` } as CSSProperties}
      >
        {hasPassage ? (
          <>
            <div
              className={cn(
                "px-6 py-7 text-[17px] leading-[1.7] @2xl:w-[var(--pw)] @2xl:shrink-0 @2xl:px-10 @2xl:py-8",
                fillHeight && "@2xl:overflow-y-auto @2xl:overscroll-contain",
              )}
            >
              {question.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- stored pictures of any size; no resizing service needed
                <img
                  src={questionImageUrl(question.image)}
                  alt="Table or graph for this question"
                  className="mb-6 h-auto w-full rounded-md bg-white"
                  loading="eager"
                />
              ) : null}
              {question.passage?.trim() ? (
                <RichText source={question.passage} data-passage />
              ) : null}
            </div>
            <div
              className={cn(
                "relative hidden w-[3px] shrink-0 bg-ink/70 @2xl:block",
                onResize && "cursor-col-resize touch-none",
              )}
              onPointerDown={
                onResize
                  ? (e) => e.currentTarget.setPointerCapture(e.pointerId)
                  : undefined
              }
              onPointerMove={onResize ? drag : undefined}
            >
              {onResize ? (
                <button
                  type="button"
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize the passage"
                  aria-valuenow={Math.round(passageWidth)}
                  aria-valuemin={25}
                  aria-valuemax={75}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft")
                      onResize(clamp(passageWidth - 5));
                    if (e.key === "ArrowRight")
                      onResize(clamp(passageWidth + 5));
                  }}
                  className="absolute left-1/2 top-28 flex h-7 w-4 -translate-x-1/2 cursor-col-resize items-center justify-center rounded-md bg-ink text-paper"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 2 1 5l3 3M6 2l3 3-3 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </button>
              ) : null}
            </div>
          </>
        ) : null}

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-5 px-6 py-7 @2xl:px-10 @2xl:py-8",
            fillHeight && "@2xl:overflow-y-auto @2xl:overscroll-contain",
            !hasPassage && "mx-auto w-full max-w-3xl",
          )}
        >
          <div className="border-b-[3px] border-dashed border-ink/80 pb-1">
            <div className="flex min-h-11 items-center gap-3 bg-mist pr-2 font-sans">
              <span className="flex h-11 min-w-11 items-center justify-center bg-ink px-2 text-[20px] font-bold text-paper tabular-nums">
                {number}
              </span>
              {headerExtra}
              {headerRight ? (
                <span className="ml-auto flex items-center">{headerRight}</span>
              ) : null}
            </div>
          </div>

          <RichText
            source={question.prompt}
            className="text-[17px] leading-relaxed"
            data-prompt
          />

          {answerSlot ?? (
            <div
              role={onChoose ? "radiogroup" : "list"}
              aria-label="Answer choices"
              className="flex flex-col gap-3.5"
            >
              {question.choices.map((choice) => {
                const isCorrect = correctId === choice.id;
                const isSelected = selectedId === choice.id;
                // Green: the right answer, or the student's pick when we only say it was right.
                const green =
                  isCorrect ||
                  (isSelected && !reviewing && pickVerdict === "right");
                // Red: the student's wrong pick.
                const red =
                  isSelected &&
                  !isCorrect &&
                  (reviewing || pickVerdict === "wrong");
                const isOut = eliminated.includes(choice.id) && !isSelected;
                // Pine: the student's current pick while answering.
                const picked = isSelected && !reviewing && !pickVerdict;
                const label = isCorrect
                  ? isSelected
                    ? "Your answer, correct"
                    : "Correct"
                  : red
                    ? "Your answer, incorrect"
                    : green
                      ? "Your answer, correct"
                      : null;

                const body = (
                  <>
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-[15px] font-bold",
                        green
                          ? "bg-correct text-paper"
                          : red
                            ? "bg-incorrect text-paper"
                            : picked
                              ? "bg-pine text-pine-ink"
                              : "border-[1.5px] border-ink",
                      )}
                    >
                      {choice.id}
                    </span>
                    <span className="text-left text-[17px] leading-snug">
                      <RichLine source={choice.text} />
                    </span>
                    {label ? (
                      <span
                        className={cn(
                          "sr-only shrink-0 font-sans text-sm font-bold @md:not-sr-only @md:ml-auto",
                          green ? "text-correct" : "text-incorrect",
                        )}
                      >
                        {label}
                      </span>
                    ) : null}
                  </>
                );

                const strong = green || picked;
                const boxClass = cn(
                  "relative flex flex-1 items-center gap-4 rounded-lg px-4 py-3.5",
                  green
                    ? "border-[3px] border-correct bg-correct-tint"
                    : red
                      ? "border-[3px] border-incorrect bg-incorrect-tint"
                      : picked
                        ? "border-[3px] border-pine bg-pine-tint"
                        : "border-[1.5px] border-ink/60 bg-paper",
                  isOut && "text-graphite opacity-70",
                );

                return (
                  <div
                    key={choice.id}
                    role={onChoose ? undefined : "listitem"}
                    className="flex items-center gap-3"
                  >
                    {onChoose ? (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onChoose(choice.id)}
                        className={cn(boxClass, !strong && "hover:border-ink")}
                      >
                        {body}
                        {isOut ? (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-2 top-1/2 h-[2px] bg-ink/70"
                          />
                        ) : null}
                      </button>
                    ) : (
                      <div className={boxClass}>{body}</div>
                    )}
                    {onToggleEliminate ? (
                      <span className="flex w-10 shrink-0 justify-center">
                        {isOut ? (
                          <button
                            type="button"
                            onClick={() => onToggleEliminate(choice.id)}
                            aria-label={`Bring back choice ${choice.id}`}
                            className="font-sans text-[13px] font-bold text-ink underline underline-offset-2"
                          >
                            Undo
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggleEliminate(choice.id)}
                            aria-label={`Cross out choice ${choice.id}`}
                            className="relative flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink font-sans text-[14px] font-bold hover:bg-wash"
                          >
                            {choice.id}
                            <span
                              aria-hidden="true"
                              className="absolute -inset-x-1.5 top-1/2 h-[2px] bg-ink"
                            />
                          </button>
                        )}
                      </span>
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
