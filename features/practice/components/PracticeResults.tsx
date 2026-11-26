"use client";

import { useActionState, useState } from "react";
import { DIFFICULTY_LABEL, isDifficulty } from "@/core/config/practice";
import { Button, ButtonLink, cn } from "@/core/design/ui";
import {
  REVIEW_FILTERS,
  ReviewScreen,
  filterCounts,
  matchesFilter,
  reviewState,
  type ReviewFilter,
  type ReviewItem,
} from "@/core/question";
import { startTopicPractice, type StartState } from "../actions";
import { numbersText } from "@/core/config/practice";
import { rangeLabel, scorePractice, type PracticeState } from "../schema";

type Props = {
  state: PracticeState;
  studentName: string;
  /** The topic page (or the list of sets), for "Back to ...". */
  backHref: string;
  backLabel: string;
};

type Row = ReviewItem & { level: string | null };

/** "Practice complete" with the score, the list of every question, and a Bluebook-style review. */
export function PracticeResults({ state, studentName, backHref, backLabel }: Props) {
  const [review, setReview] = useState<null | { id?: string; filter: ReviewFilter; show: boolean }>(null);
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [showAnswers, setShowAnswers] = useState(false);
  const score = scorePractice(state.questions);
  const range = state.options ? rangeLabel(state.options) : null;
  const title = range ? `${state.title}: ${range}` : state.title;

  const rows: Row[] = state.questions.map((q, i) => ({
    id: q.id,
    number: i + 1,
    type: q.type,
    passage: q.passage,
    image: q.image,
    prompt: q.prompt,
    choices: q.choices,
    answer: q.feedback?.answer ?? q.answer,
    correctAnswer: q.feedback?.correctAnswer ?? null,
    isCorrect: q.feedback?.isCorrect === true,
    marked: q.marked,
    explanation: q.feedback?.explanation ?? null,
    level: q.difficulty,
  }));
  const counts = filterCounts(rows);
  const shown = rows.filter((r) => matchesFilter(r, filter));

  const reviewScreen = review ? (
      <ReviewScreen
        title={title}
        items={rows}
        startId={review.id}
        startFilter={review.filter}
        showAnswers={review.show}
        studentName={studentName}
        onClose={() => setReview(null)}
      />
  ) : null;

  return (
    <main className="mx-auto max-w-[880px] px-4 pb-20 sm:px-5">
      {reviewScreen}
      <section className="rounded-panel border border-hairline bg-paper px-6 py-10 text-center sm:px-10">
        <h1 className="text-[34px] font-extrabold leading-tight tracking-tight">Practice complete</h1>
        <p className="mt-1.5 text-[17px] text-ink-soft">{title}</p>

        <p className="mt-8 text-[64px] font-extrabold leading-none tracking-tight tabular-nums text-pine">
          {score.percent}%
        </p>
        <p className="mt-2 text-[17px] text-ink-soft">
          {score.correct} of {score.total} correct
        </p>

        <dl className="mx-auto mt-8 grid max-w-md grid-cols-3 divide-x divide-hairline rounded-card border border-hairline">
          <Stat label="Correct" value={score.correct} className="text-correct" />
          <Stat label="Incorrect" value={score.incorrect} className="text-incorrect" />
          <Stat label="Skipped" value={score.skipped} />
        </dl>

        <div className="mx-auto mt-9 flex max-w-sm flex-col items-center gap-3">
          <Button size="lg" className="w-full" onClick={() => setReview({ filter: "all", show: showAnswers })}>
            Review your work
          </Button>
          <NextRange state={state} />
          <ButtonLink href={backHref} variant="plain">
            {backLabel}
          </ButtonLink>
        </div>
      </section>

      <section className="mt-6 rounded-panel border border-hairline bg-paper">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 pb-4 pt-6">
          <h2 className="text-xl font-extrabold tracking-tight">Your answers</h2>
          <label className="flex cursor-pointer items-center gap-2.5 text-[15px] font-semibold">
            <input
              type="checkbox"
              checked={showAnswers}
              onChange={(e) => setShowAnswers(e.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="relative h-6 w-10 rounded-full bg-control transition-colors peer-checked:bg-pine peer-focus-visible:outline-2 peer-focus-visible:outline-pine after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-paper after:transition-transform peer-checked:after:translate-x-4"
            />
            Show correct answers
          </label>
        </div>

        <div role="tablist" aria-label="Show questions" className="flex gap-1 overflow-x-auto border-b border-hairline px-4">
          {REVIEW_FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              type="button"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-[15px] font-semibold tabular-nums",
                filter === f.key ? "border-pine text-ink" : "border-transparent text-graphite hover:text-ink",
              )}
            >
              {f.label} <span className="font-bold">{counts[f.key]}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="px-6 py-10 text-center text-[15px] text-graphite">
            {filter === "incorrect"
              ? "No incorrect answers."
              : filter === "skipped"
                ? "You answered every question."
                : "No questions here."}
          </p>
        ) : (
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="border-b border-hairline text-[13px] text-graphite">
                <th scope="col" className="py-2.5 pl-6 pr-2 font-semibold">
                  Question
                </th>
                <th scope="col" className="hidden px-2 py-2.5 font-semibold sm:table-cell">
                  Level
                </th>
                <th scope="col" className="px-2 py-2.5 font-semibold">
                  Correct
                </th>
                <th scope="col" className="px-2 py-2.5 font-semibold">
                  Yours
                </th>
                <th scope="col" className="py-2.5 pl-2 pr-6 font-semibold">
                  <span className="sr-only">Review</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {shown.map((r) => {
                const s = reviewState(r);
                return (
                  <tr key={r.id} className="hover:bg-mist">
                    <td className="py-3 pl-6 pr-2 font-bold tabular-nums">
                      {r.number}
                      {r.marked ? <span className="ml-2 text-[12px] font-semibold text-graphite">Marked</span> : null}
                    </td>
                    <td className="hidden px-2 py-3 text-ink-soft sm:table-cell">
                      {isDifficulty(r.level) ? DIFFICULTY_LABEL[r.level] : ""}
                    </td>
                    <td className="px-2 py-3 font-bold">
                      {showAnswers ? (
                        r.correctAnswer
                      ) : (
                        <span className="text-graphite" aria-label="Hidden">
                          •
                        </span>
                      )}
                    </td>
                    <td className={cn("px-2 py-3 font-bold", s === "correct" ? "text-correct" : "text-incorrect")}>
                      {s === "skipped" ? "Omitted" : r.answer}
                    </td>
                    <td className="py-2 pl-2 pr-6 text-end">
                      <button
                        type="button"
                        onClick={() => setReview({ id: r.id, filter, show: showAnswers })}
                        className="rounded-full px-3 py-1.5 text-[14px] font-bold text-pine hover:bg-pine-tint"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="flex flex-col-reverse px-2 py-4">
      <dt className="text-[13px] font-semibold text-graphite">{label}</dt>
      <dd className={cn("text-[26px] font-extrabold tabular-nums", className)}>{value}</dd>
    </div>
  );
}

/** "Start the next ones, #26–50" with the same level, size, checking and timer. */
function NextRange({ state }: { state: PracticeState }) {
  const [result, action, pending] = useActionState<StartState, FormData>(startTopicPractice, { message: null });
  const o = state.options;
  if (state.kind !== "topic" || !o || !state.setId || state.moreAfter <= 0) return null;
  const size = o.to - o.from + 1;
  const from = o.to + 1;
  const to = o.to + Math.min(size, state.moreAfter);
  return (
    <form action={action} className="flex w-full flex-col">
      <input type="hidden" name="setId" value={state.setId} />
      <input type="hidden" name="difficulty" value={o.difficulty} />
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="count" value={size} />
      <input type="hidden" name="checkMode" value={state.checkMode} />
      <input type="hidden" name="minutes" value={o.minutes ?? ""} />
      <Button type="submit" variant="quiet" size="lg" disabled={pending}>
        {pending ? "Starting…" : `Start ${numbersText(from, to)}`}
      </Button>
      {result.message ? <p className="mt-2 text-sm text-graphite">{result.message}</p> : null}
    </form>
  );
}
