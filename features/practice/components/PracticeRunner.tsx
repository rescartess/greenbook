"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ButtonLink } from "@/core/design/ui";
import { AnswerCheck, type CheckFeedback } from "@/core/question";
import { checkPracticeAnswer, finishPractice } from "../actions";
import type { PracticeState } from "../schema";

/** Untimed practice: one question at a time, checked right away, then a short summary. */
export function PracticeRunner({ state, backHref }: { state: PracticeState; backHref: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Record<string, CheckFeedback | null>>(() =>
    Object.fromEntries(state.questions.map((q) => [q.id, q.feedback])),
  );
  const firstOpen = state.questions.findIndex((q) => !q.feedback);
  const [index, setIndex] = useState(firstOpen === -1 ? Math.max(0, state.questions.length - 1) : firstOpen);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = state.questions.length;
  const checked = Object.values(feedback).filter(Boolean);
  const right = checked.filter((f) => f!.isCorrect).length;
  const q = state.questions[index];

  const finish = () =>
    start(async () => {
      try {
        await finishPractice(state.attemptId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Try again.");
      }
    });

  if (state.status === "completed") {
    return (
      <section className="mx-auto max-w-[720px] px-5 pt-10">
        <h1 className="text-3xl font-extrabold tracking-tight">{state.title}</h1>
        <p className="mt-2 text-[17px] text-ink-soft">
          {right} of {total} right{checked.length < total ? ` (${total - checked.length} skipped)` : ""}. Wrong answers are waiting in Mistakes.
        </p>
        <ol className="mt-6 divide-y divide-hairline rounded-card border border-hairline bg-paper">
          {state.questions.map((item) => {
            const f = feedback[item.id];
            return (
              <li key={item.id} className="flex items-center gap-4 px-6 py-3.5 text-[15px]">
                <span className="w-7 font-bold tabular-nums text-graphite">{item.position}</span>
                <span className="flex-1 text-ink-soft">{item.skill ?? "Question"}</span>
                <span className={f?.isCorrect ? "font-bold text-pine" : "font-bold"}>{f ? (f.isCorrect ? "Right" : "Wrong") : "Skipped"}</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex gap-2.5">
          <ButtonLink href={backHref}>Back to practice</ButtonLink>
          <ButtonLink href={`/${state.subject}/mistakes`} variant="quiet">
            Review mistakes
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[1480px] px-3 pb-16 sm:px-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{state.title}</h1>
          <p className="text-[15px] text-graphite">
            Question {index + 1} of {total}. {right} right so far.
          </p>
        </div>
        <div className="flex gap-2">
          {index > 0 ? (
            <Button variant="quiet" size="sm" onClick={() => setIndex(index - 1)}>
              Previous
            </Button>
          ) : null}
          <Button variant="quiet" size="sm" onClick={finish} disabled={pending}>
            {pending ? "Finishing…" : "Finish practice"}
          </Button>
        </div>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-mist" aria-hidden="true">
        <div className="h-1.5 rounded-full bg-pine" style={{ width: `${Math.round((checked.length / Math.max(1, total)) * 100)}%` }} />
      </div>
      {error ? (
        <p role="alert" className="mb-4 rounded-choice bg-wash px-4 py-2.5 font-semibold">
          {error}
        </p>
      ) : null}
      {q ? (
        <AnswerCheck
          key={q.id}
          number={q.position}
          question={q}
          initialFeedback={feedback[q.id]}
          onCheck={async (answer) => {
            const f = await checkPracticeAnswer(state.attemptModuleId, q.id, answer);
            setFeedback((all) => ({ ...all, [q.id]: f }));
            return f;
          }}
          after={() =>
            index < total - 1 ? (
              <Button onClick={() => setIndex(index + 1)}>Next question</Button>
            ) : (
              <Button onClick={finish} disabled={pending}>
                {pending ? "Finishing…" : "See how you did"}
              </Button>
            )
          }
        />
      ) : (
        <p>
          This set has no questions. <Link href={backHref}>Go back</Link>
        </p>
      )}
    </div>
  );
}
