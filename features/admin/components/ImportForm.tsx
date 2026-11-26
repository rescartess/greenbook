"use client";

import { useActionState } from "react";
import { Button, ButtonLink } from "@/core/design/ui";
import { importQuestions, type ImportState } from "../actions";

const EXAMPLE = `[
  {
    "passage": "In 1856, *a scientist* noted that ______ ...",
    "question": "Which choice completes the text with the most logical and precise word or phrase?",
    "choices": ["first", "second", "third", "fourth"],
    "answer": "B",
    "explanation": "One or two sentences on why B is right.",
    "topic": "Words in Context",
    "difficulty": "medium"
  }
]`;

export function ImportForm({ moduleId, moduleLabel, backHref }: { moduleId: string; moduleLabel: string; backHref: string }) {
  const [state, action, pending] = useActionState(importQuestions.bind(null, moduleId), {
    step: "paste",
    message: null,
    problems: [],
  } as ImportState);

  if (state.step === "done") {
    return (
      <div className="rounded-panel border border-hairline bg-paper p-6">
        <p className="text-[19px] font-bold">
          {state.count} question{state.count === 1 ? "" : "s"} added to {moduleLabel}.
        </p>
        <p className="mt-1 text-[15px] text-graphite">They are drafts until you publish the test.</p>
        <div className="mt-5 flex gap-2.5">
          <ButtonLink href={`/admin/questions/${state.firstId}`}>Look at the first one</ButtonLink>
          <ButtonLink href={backHref} variant="quiet">
            Back to the test
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex flex-col gap-4 rounded-panel border border-hairline bg-paper p-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-[15px] font-bold">Questions (JSON)</span>
          <textarea
            name="json"
            rows={18}
            defaultValue={state.step === "ready" ? state.json : undefined}
            readOnly={state.step === "ready"}
            placeholder={EXAMPLE}
            spellCheck={false}
            className="w-full rounded-choice border-[1.5px] border-control bg-paper px-3.5 py-2.5 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-pine"
          />
        </label>
        {state.step === "paste" && state.message ? (
          <div role="alert" className="rounded-choice bg-wash px-4 py-3 text-[15px]">
            <p className="font-bold">{state.message}</p>
            {state.problems.length ? (
              <ul className="mt-1.5 list-disc pl-5">
                {state.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {state.step === "ready" ? (
          <div className="flex flex-wrap items-center gap-3 rounded-choice bg-pine-tint px-4 py-3">
            <p className="text-[15px] font-bold text-pine">
              All {state.count} question{state.count === 1 ? "" : "s"} look right.
            </p>
            <input type="hidden" name="confirm" value="yes" />
            <Button type="submit" disabled={pending}>
              {pending ? "Importing…" : `Add ${state.count} to ${moduleLabel}`}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2.5">
            <Button type="submit" disabled={pending}>
              {pending ? "Checking…" : "Check questions"}
            </Button>
            <ButtonLink href={backHref} variant="quiet">
              Cancel
            </ButtonLink>
          </div>
        )}
      </div>
      <aside className="rounded-panel border border-hairline bg-paper p-6 text-[15px] leading-relaxed text-ink-soft">
        <p className="font-bold text-ink">Format</p>
        <p className="mt-1.5">
          A list of questions. Each needs a question, four choices, the answer letter and a topic (its name, like “Transitions”).
          Passage, explanation and difficulty (easy, medium or hard; medium if left out) are optional.
        </p>
        <p className="mt-3">
          Text can use *italic*, **bold**, &lt;u&gt;underline&lt;/u&gt; and ______ for blanks, just like the question editor.
        </p>
        <p className="mt-3">Nothing is added until every question passes the check and you confirm. Up to 60 at a time.</p>
      </aside>
    </form>
  );
}
