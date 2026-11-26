"use client";

import { useEffect, useRef, useState } from "react";
import { Button, cn } from "@/core/design/ui";
import type { QuestionChoice } from "./choices";
import {
  ExamBottomBar,
  ExamTitle,
  ExamTopBar,
  MapButton,
  QuestionMapGrid,
  QuestionMapPopover,
  type MapItem,
} from "./ExamParts";
import { QuestionView } from "./QuestionView";
import { RichText } from "./RichText";
import { VerdictTag } from "./VerdictTag";

/** One finished question, as the review screen needs it. */
export type ReviewItem = {
  id: string;
  /** The number the student saw (1, 2, 3... within its module or practice). */
  number: number;
  /** For full tests: "Module 1" etc. Shown in the map title. */
  group?: string;
  type?: string;
  passage: string | null;
  image?: string | null;
  prompt: string;
  choices: QuestionChoice[];
  answer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
  marked: boolean;
  explanation?: string | null;
};

export type ReviewFilter = "all" | "incorrect" | "skipped" | "marked";

export const REVIEW_FILTERS: { key: ReviewFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "incorrect", label: "Incorrect" },
  { key: "skipped", label: "Skipped" },
  { key: "marked", label: "Marked" },
];

export function reviewState(
  q: Pick<ReviewItem, "isCorrect" | "answer">,
): "correct" | "wrong" | "skipped" {
  return q.isCorrect ? "correct" : q.answer ? "wrong" : "skipped";
}

export function matchesFilter(
  q: Pick<ReviewItem, "isCorrect" | "answer" | "marked">,
  f: ReviewFilter,
): boolean {
  const s = reviewState(q);
  return f === "all"
    ? true
    : f === "incorrect"
      ? s === "wrong"
      : f === "skipped"
        ? s === "skipped"
        : q.marked;
}

export function filterCounts(
  items: readonly ReviewItem[],
): Record<ReviewFilter, number> {
  return {
    all: items.length,
    incorrect: items.filter((q) => matchesFilter(q, "incorrect")).length,
    skipped: items.filter((q) => matchesFilter(q, "skipped")).length,
    marked: items.filter((q) => matchesFilter(q, "marked")).length,
  };
}

type Props = {
  title: string;
  items: ReviewItem[];
  /** Which question to open first, and which list to move through. */
  startId?: string;
  startFilter?: ReviewFilter;
  /** Start with the correct answers showing (the student can switch). */
  showAnswers?: boolean;
  studentName: string;
  onClose: () => void;
};

/**
 * Going back through finished questions on the Bluebook screen. The student moves through all
 * questions or only the incorrect, skipped or marked ones, and can show or hide the correct answer.
 */
export function ReviewScreen({
  title,
  items,
  startId,
  startFilter = "all",
  showAnswers = false,
  studentName,
  onClose,
}: Props) {
  const [filter, setFilter] = useState<ReviewFilter>(startFilter);
  const [currentId, setCurrentId] = useState<string | null>(startId ?? null);
  const [reveal, setReveal] = useState(showAnswers);
  const [mapOpen, setMapOpen] = useState(false);
  const [split, setSplit] = useState(50);
  const rootRef = useRef<HTMLDivElement>(null);

  // Opens over the whole page; Escape closes it.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

  const shown = items.filter((q) => matchesFilter(q, filter));
  const index = Math.max(
    0,
    shown.findIndex((q) => q.id === currentId),
  );
  const current = shown[index] ?? null;
  const counts = filterCounts(items);

  const choose = (f: ReviewFilter) => {
    setFilter(f);
    setCurrentId(items.find((q) => matchesFilter(q, f))?.id ?? null);
    setMapOpen(false);
  };
  const go = (i: number) => {
    setCurrentId(shown[i]?.id ?? null);
    rootRef.current?.scrollTo({ top: 0 });
  };

  const mapItems: MapItem[] = shown.map((q) => ({
    id: q.id,
    number: q.number,
    state: reviewState(q),
    marked: q.marked,
  }));
  const groups = [...new Set(shown.map((q) => q.group ?? ""))];

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Review: ${title}`}
      className="exam fixed inset-0 z-50 overflow-y-auto bg-paper font-sans"
    >
      <ExamTopBar
        left={
          <ExamTitle
            title={<span className="max-sm:sr-only">Review: {title}</span>}
          />
        }
        center={
          <div
            role="group"
            aria-label="Show questions"
            className="flex rounded-full border-[1.5px] border-ink bg-paper p-0.5"
          >
            {REVIEW_FILTERS.filter(
              (f) => f.key === "all" || counts[f.key] > 0,
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => choose(f.key)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[13px] font-bold tabular-nums sm:px-3.5 sm:text-[14px]",
                  filter === f.key ? "bg-ink text-paper" : "hover:bg-wash",
                )}
              >
                {f.label} {counts[f.key]}
              </button>
            ))}
          </div>
        }
        right={
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        }
      />

      <main className="mx-auto max-w-[1600px] pb-28 min-[42rem]:pb-[79px]">
        {current ? (
          <>
            <QuestionView
              key={current.id}
              number={current.number}
              question={current}
              selectedId={current.answer}
              correctId={reveal ? current.correctAnswer : null}
              pickVerdict={
                current.answer ? (current.isCorrect ? "right" : "wrong") : null
              }
              passageWidth={split}
              onResize={setSplit}
              fillHeight
              headerExtra={
                current.marked ? (
                  <span className="text-[15px] font-bold">
                    Marked for Review
                  </span>
                ) : null
              }
              headerRight={
                <>
                  <VerdictTag
                    correct={current.isCorrect}
                    skipped={!current.answer}
                    className="mr-3"
                  />
                  <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
                    <input
                      type="checkbox"
                      checked={reveal}
                      onChange={(e) => setReveal(e.target.checked)}
                      className="h-4 w-4 accent-pine"
                    />
                    <span className="hidden sm:inline">
                      Show correct answer
                    </span>
                    <span className="sm:hidden">Answer</span>
                  </label>
                </>
              }
              answerSlot={
                current.type === "spr" ? (
                  <div className="flex flex-col gap-1 font-sans text-[17px]">
                    <p>
                      Your answer:{" "}
                      <strong
                        className={
                          current.isCorrect ? "text-correct" : "text-incorrect"
                        }
                      >
                        {current.answer ?? "none"}
                      </strong>
                    </p>
                    {reveal ? (
                      <p>
                        Correct answer:{" "}
                        <strong className="text-correct">
                          {current.correctAnswer}
                        </strong>
                      </p>
                    ) : null}
                  </div>
                ) : undefined
              }
            />
            {reveal && current.explanation ? (
              <section className="mx-auto mt-2 max-w-[820px] px-5">
                <div className="rounded-panel border border-hairline bg-paper px-6 py-5">
                  <p className="text-[15px] font-bold">Explanation</p>
                  <RichText
                    source={current.explanation}
                    className="mt-1.5 text-[15px] leading-relaxed text-ink-soft"
                  />
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section className="mx-auto max-w-[560px] px-5 pt-16 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">
              Nothing to show here.
            </h1>
            <Button
              className="mt-6"
              variant="quiet"
              onClick={() => choose("all")}
            >
              Show all questions
            </Button>
          </section>
        )}
      </main>

      {mapOpen && current ? (
        <QuestionMapPopover
          title={
            REVIEW_FILTERS.find((f) => f.key === filter)!.label + " questions"
          }
          onClose={() => setMapOpen(false)}
        >
          {groups.map((g, gi) => (
            <div key={g} className="mb-4 last:mb-0">
              {g ? <p className="mb-2 text-[14px] font-bold">{g}</p> : null}
              <QuestionMapGrid
                legend={gi === 0}
                items={mapItems.filter((_, i) => (shown[i].group ?? "") === g)}
                currentId={current.id}
                onPick={(id) => {
                  setCurrentId(id);
                  setMapOpen(false);
                }}
              />
            </div>
          ))}
        </QuestionMapPopover>
      ) : null}

      <ExamBottomBar
        left={studentName}
        center={
          current ? (
            <MapButton
              label={`${index + 1} of ${shown.length}`}
              open={mapOpen}
              onClick={() => setMapOpen((o) => !o)}
            />
          ) : null
        }
        right={
          current ? (
            <>
              {index > 0 ? (
                <Button variant="quiet" onClick={() => go(index - 1)}>
                  Back
                </Button>
              ) : null}
              {index < shown.length - 1 ? (
                <Button onClick={() => go(index + 1)}>Next</Button>
              ) : (
                <Button onClick={onClose}>Done</Button>
              )}
            </>
          ) : null
        }
      />
    </div>
  );
}
