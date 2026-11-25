"use client";

import { useActionState, useState } from "react";
import { Button, ButtonLink, cn } from "@/core/design/ui";
import {
  ExamBottomBar,
  ExamTitle,
  ExamTopBar,
  MapButton,
  QuestionMapGrid,
  QuestionMapPopover,
  QuestionView,
  type MapItem,
} from "@/core/question";
import { startTopicPractice, type StartState } from "../actions";
import { rangeLabel, scorePractice, type PracticeQuestion, type PracticeState } from "../schema";
import { VerdictTag } from "./VerdictTag";

type Filter = "all" | "incorrect" | "marked";

type Props = {
  state: PracticeState;
  studentName: string;
  /** The topic page (or the list of sets), for "Back to ...". */
  backHref: string;
  backLabel: string;
};

const isRight = (q: PracticeQuestion) => q.feedback?.isCorrect === true;
const answerOf = (q: PracticeQuestion) => q.feedback?.answer ?? q.answer;

/** "Practice complete" with the score, then a Bluebook-style review with an "Incorrect only" filter. */
export function PracticeResults({ state, studentName, backHref, backLabel }: Props) {
  const [reviewing, setReviewing] = useState(false);
  const score = scorePractice(state.questions);
  const range = state.options ? rangeLabel(state.options) : null;

  if (reviewing) {
    return <Review state={state} studentName={studentName} range={range} onDone={() => setReviewing(false)} />;
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-90px)] max-w-[640px] flex-col justify-center px-5 pb-16">
      <section className="rounded-panel border border-hairline bg-paper px-6 py-10 text-center sm:px-10">
        <h1 className="text-[34px] font-extrabold leading-tight tracking-tight">Practice complete</h1>
        <p className="mt-1.5 text-[17px] text-ink-soft">
          {state.title}
          {range ? `: ${range}` : ""}
        </p>

        <p className="mt-8 text-[64px] font-extrabold leading-none tracking-tight tabular-nums text-pine">
          {score.percent}%
        </p>
        <p className="mt-2 text-[17px] text-ink-soft">
          {score.correct} of {score.total} correct
        </p>

        <dl className="mx-auto mt-8 grid max-w-md grid-cols-3 divide-x divide-hairline rounded-card border border-hairline">
          <Stat label="Correct" value={score.correct} />
          <Stat label="Incorrect" value={score.incorrect} />
          <Stat label="Skipped" value={score.skipped} />
        </dl>

        <div className="mt-9 flex flex-col items-center gap-3">
          <Button size="lg" className="w-full max-w-sm" onClick={() => setReviewing(true)}>
            Review your work
          </Button>
          <NextRange state={state} />
          <ButtonLink href={backHref} variant="plain">
            {backLabel}
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col-reverse px-2 py-4">
      <dt className="text-[13px] font-semibold text-graphite">{label}</dt>
      <dd className="text-[26px] font-extrabold tabular-nums">{value}</dd>
    </div>
  );
}

/** "Start #26–50" with the same level, size, checking and timer. */
function NextRange({ state }: { state: PracticeState }) {
  const [result, action, pending] = useActionState<StartState, FormData>(startTopicPractice, { message: null });
  const o = state.options;
  if (state.kind !== "topic" || !o || !state.setId || state.moreAfter <= 0) return null;
  const size = o.to - o.from + 1;
  const from = o.to + 1;
  const to = o.to + Math.min(size, state.moreAfter);
  return (
    <form action={action} className="flex w-full max-w-sm flex-col">
      <input type="hidden" name="setId" value={state.setId} />
      <input type="hidden" name="difficulty" value={o.difficulty} />
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="count" value={size} />
      <input type="hidden" name="checkMode" value={state.checkMode} />
      <input type="hidden" name="minutes" value={o.minutes ?? ""} />
      <Button type="submit" variant="quiet" size="lg" disabled={pending}>
        {pending ? "Starting…" : `Start the next ones, #${from}–${to}`}
      </Button>
      {result.message ? <p className="mt-2 text-sm text-graphite">{result.message}</p> : null}
    </form>
  );
}

function Review({
  state,
  studentName,
  range,
  onDone,
}: {
  state: PracticeState;
  studentName: string;
  range: string | null;
  onDone: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [index, setIndex] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const [split, setSplit] = useState(50);

  const numbered = state.questions.map((q, i) => ({ q, n: i + 1 }));
  const shown = numbered.filter(({ q }) =>
    filter === "incorrect" ? !isRight(q) : filter === "marked" ? q.marked : true,
  );
  const safeIndex = Math.min(index, Math.max(0, shown.length - 1));
  const current = shown[safeIndex] ?? null;
  const counts = {
    all: numbered.length,
    incorrect: numbered.filter(({ q }) => !isRight(q)).length,
    marked: numbered.filter(({ q }) => q.marked).length,
  };

  const items: MapItem[] = shown.map(({ q, n }) => ({
    id: q.id,
    number: n,
    state: isRight(q) ? "correct" : answerOf(q) ? "wrong" : "skipped",
    marked: q.marked,
  }));

  const choose = (f: Filter) => {
    setFilter(f);
    setIndex(0);
    setMapOpen(false);
  };

  return (
    <div className="min-h-dvh bg-paper font-sans">
      <ExamTopBar
        left={
          <ExamTitle
            title={
              <span className="max-sm:sr-only">
                Review: {state.title}
                {range ? <span className="hidden font-semibold text-ink-soft sm:inline">, {range}</span> : null}
              </span>
            }
          />
        }
        center={
          <div role="group" aria-label="Show questions" className="flex rounded-full border-[1.5px] border-ink bg-paper p-0.5">
            {(
              [
                ["all", "All"],
                ["incorrect", "Incorrect"],
                ["marked", "Marked"],
              ] as const
            ).map(([key, label]) =>
              key === "marked" && counts.marked === 0 ? null : (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => choose(key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[13px] font-bold tabular-nums sm:px-4 sm:text-[14px]",
                    filter === key ? "bg-ink text-paper" : "hover:bg-wash",
                  )}
                >
                  {label} {counts[key]}
                </button>
              ),
            )}
          </div>
        }
        right={
          <Button size="sm" onClick={onDone}>
            Done
          </Button>
        }
      />

      <main className="mx-auto max-w-[1600px] pb-28">
        {current ? (
          <QuestionView
            key={current.q.id}
            number={current.n}
            question={current.q}
            selectedId={answerOf(current.q)}
            correctId={current.q.feedback?.correctAnswer ?? null}
            passageWidth={split}
            onResize={setSplit}
            fillHeight
            headerExtra={
              current.q.marked ? (
                <span className="flex items-center gap-1.5 text-[15px] font-bold">Marked for Review</span>
              ) : null
            }
            headerRight={<VerdictTag correct={isRight(current.q)} skipped={!answerOf(current.q)} />}
            answerSlot={
              current.q.type === "spr" ? (
                <div className="flex flex-col gap-1 font-sans text-[17px]">
                  <p>
                    Your answer: <strong>{answerOf(current.q) ?? "none"}</strong>
                  </p>
                  <p>
                    Correct answer: <strong>{current.q.feedback?.correctAnswer}</strong>
                  </p>
                </div>
              ) : undefined
            }
          />
        ) : (
          <section className="mx-auto max-w-[560px] px-5 pt-16 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {filter === "incorrect" ? "You got every question right." : "Nothing to show here."}
            </h1>
            <Button className="mt-6" variant="quiet" onClick={() => choose("all")}>
              Show all questions
            </Button>
          </section>
        )}
      </main>

      {mapOpen && items.length > 0 ? (
        <QuestionMapPopover title={filter === "incorrect" ? "Incorrect and skipped" : "Questions"} onClose={() => setMapOpen(false)}>
          <QuestionMapGrid
            items={items}
            currentId={current?.q.id}
            onPick={(id) => {
              setIndex(shown.findIndex(({ q }) => q.id === id));
              setMapOpen(false);
            }}
          />
        </QuestionMapPopover>
      ) : null}

      <ExamBottomBar
        left={studentName}
        center={
          current ? (
            <MapButton
              current={current.n}
              total={numbered.length}
              open={mapOpen}
              onClick={() => setMapOpen((o) => !o)}
            />
          ) : null
        }
        right={
          current ? (
            <>
              {safeIndex > 0 ? (
                <Button variant="quiet" onClick={() => setIndex(safeIndex - 1)}>
                  Back
                </Button>
              ) : null}
              {safeIndex < shown.length - 1 ? (
                <Button onClick={() => setIndex(safeIndex + 1)}>Next</Button>
              ) : (
                <Button onClick={onDone}>Done</Button>
              )}
            </>
          ) : null
        }
      />
    </div>
  );
}
