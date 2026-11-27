"use client";

import { useActionState, useState } from "react";
import { Button, ButtonLink } from "@/core/design/ui";
import { QuestionsOverview, ReviewScreen, type OverviewItem, type ReviewFilter, type ReviewItem } from "@/core/question";
import { SUBJECTS, isSubjectSlug, skillDomain } from "@/core/config/subjects";
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

/** "Practice complete": the title and score, then the Questions Overview table (owner reference, 27 Nov 2026). */
export function PracticeResults({ state, studentName, backHref, backLabel }: Props) {
  const [review, setReview] = useState<null | { id?: string; filter: ReviewFilter; show: boolean }>(null);
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

  const section = isSubjectSlug(state.subject) ? SUBJECTS[state.subject].name : "Reading and Writing";
  const items: OverviewItem[] = rows.map((r, i) => ({
    ...r,
    section,
    domain: skillDomain(state.questions[i].skill as string | null),
  }));

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-8">
      {reviewScreen}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pt-2">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink-soft">Practice complete</p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.01em] sm:text-[32px]">{title}</h1>
          <p className="mt-1 text-[17px] text-ink-soft tabular-nums">
            {score.correct} of {score.total} correct, {score.percent}%
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href={backHref} variant="plain">
            {backLabel}
          </ButtonLink>
          <NextRange state={state} />
          <Button onClick={() => setReview({ filter: "all", show: false })}>Review your work</Button>
        </div>
      </header>

      <QuestionsOverview items={items} title={title} studentName={studentName} />
    </main>
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
    <form action={action} className="flex flex-col">
      <input type="hidden" name="setId" value={state.setId} />
      <input type="hidden" name="difficulty" value={o.difficulty} />
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="count" value={size} />
      <input type="hidden" name="checkMode" value={state.checkMode} />
      <input type="hidden" name="minutes" value={o.minutes ?? ""} />
      <Button type="submit" variant="quiet" disabled={pending}>
        {pending ? "Starting…" : `Start ${numbersText(from, to)}`}
      </Button>
      {result.message ? <p className="mt-2 text-sm text-graphite">{result.message}</p> : null}
    </form>
  );
}
