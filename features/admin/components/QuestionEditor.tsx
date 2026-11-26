"use client";

import { useActionState, useState, type ReactNode } from "react";
import { cn } from "@/core/design/ui";
import { Btn, BtnLink } from "@/core/shell";
import { QuestionView, RichText } from "@/core/question";
import type { SkillGroup } from "../queries";
import { CHOICE_IDS, type QuestionFormState } from "../schema";

export type EditorValues = {
  passage: string;
  prompt: string;
  choices: Record<string, string>;
  correct: string;
  explanation: string;
  skillId: number | null;
  difficulty: string;
  status: string;
};

type Props = {
  number: number;
  cancelHref: string;
  initial: EditorValues;
  skills: SkillGroup[];
  action: (
    state: QuestionFormState,
    formData: FormData,
  ) => Promise<QuestionFormState>;
  /** New questions always start as drafts, so the status picker is hidden. */
  showStatus?: boolean;
  submitLabel?: string;
};

const inputClass =
  "w-full rounded-choice border-[1.5px] border-control bg-paper px-3.5 py-2.5 text-[15px] leading-relaxed text-ink outline-none focus:border-pine";

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[15px] font-bold">{label}</span>
      {children}
      {hint ? (
        <span className="text-[13px] leading-snug text-graphite">{hint}</span>
      ) : null}
      {error ? (
        <span role="alert" className="text-sm font-bold text-ink">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** The edit form, with a live preview of exactly what students will see. */
export function QuestionEditor({
  number,
  cancelHref,
  initial,
  skills,
  action,
  showStatus = true,
  submitLabel = "Save changes",
}: Props) {
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
  } as QuestionFormState);
  const [values, setValues] = useState(initial);
  const errors = state.status === "error" ? state.fields : {};
  const set = <K extends keyof EditorValues>(key: K, value: EditorValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  return (
    <form
      action={formAction}
      className="grid items-start gap-6 xl:grid-cols-[27rem_minmax(0,1fr)]"
    >
      <div className="flex flex-col gap-5 rounded-panel border border-hairline bg-paper p-6">
        <Field
          label="Passage"
          error={errors.passage}
          hint={
            <>
              Formatting: *italic*, **bold**, &lt;u&gt;underline&lt;/u&gt;,
              ______ for a blank. Start lines with “- ” for notes. Table rows
              look like | Country | 1995 |. Leave empty for questions without a
              passage.
            </>
          }
        >
          <textarea
            name="passage"
            rows={10}
            value={values.passage}
            onChange={(e) => set("passage", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Question" error={errors.prompt}>
          <textarea
            name="prompt"
            rows={3}
            value={values.prompt}
            onChange={(e) => set("prompt", e.target.value)}
            className={inputClass}
          />
        </Field>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1.5 text-[15px] font-bold">
            Choices (select the correct one)
          </legend>
          {CHOICE_IDS.map((id) => (
            <div key={id} className="flex items-center gap-3">
              <label className="flex shrink-0 cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  value={id}
                  checked={values.correct === id}
                  onChange={() => set("correct", id)}
                  className="h-4 w-4 accent-pine"
                />
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                    values.correct === id
                      ? "bg-pine text-pine-ink"
                      : "border-[1.5px] border-ink",
                  )}
                >
                  {id}
                </span>
                <span className="sr-only">Correct answer {id}</span>
              </label>
              <input
                name={`choice_${id}`}
                aria-label={`Choice ${id}`}
                value={values.choices[id] ?? ""}
                onChange={(e) =>
                  set("choices", { ...values.choices, [id]: e.target.value })
                }
                className={inputClass}
              />
            </div>
          ))}
          {errors.choices || errors.correct ? (
            <span role="alert" className="text-sm font-bold text-ink">
              {errors.choices ?? errors.correct}
            </span>
          ) : null}
        </fieldset>

        <Field
          label="Explanation"
          error={errors.explanation}
          hint="Shown to students after they answer."
        >
          <textarea
            name="explanation"
            rows={4}
            value={values.explanation}
            onChange={(e) => set("explanation", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Topic" error={errors.skillId}>
          <select
            name="skillId"
            defaultValue={initial.skillId ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Pick a topic
            </option>
            {skills.map((group) => (
              <optgroup key={group.domain} label={group.domain}>
                {group.skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Difficulty" error={errors.difficulty}>
            <select
              name="difficulty"
              defaultValue={initial.difficulty}
              className={inputClass}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </Field>
          {showStatus ? (
            <Field label="Status" error={errors.status}>
              <select
                name="status"
                defaultValue={initial.status}
                className={inputClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="retired">Retired</option>
              </select>
            </Field>
          ) : (
            <input type="hidden" name="status" value="draft" />
          )}
        </div>

        {state.status === "error" ? (
          <p
            role="alert"
            className="rounded-choice bg-wash px-4 py-3 text-[15px] font-bold"
          >
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2.5 border-t border-hairline pt-5">
          <Btn type="submit" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </Btn>
          <BtnLink href={cancelHref} tone="quiet">
            Discard changes
          </BtnLink>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:sticky xl:top-20">
        <p className="text-[15px] font-semibold text-graphite">
          Preview: what students will see
        </p>
        <div className="overflow-hidden rounded-card border border-hairline bg-paper">
          <QuestionView
            number={number}
            correctId={values.correct}
            question={{
              passage: values.passage,
              prompt: values.prompt || "Your question appears here.",
              choices: CHOICE_IDS.map((id) => ({
                id,
                text: values.choices[id] || "…",
              })),
            }}
          />
        </div>
        {values.explanation.trim() ? (
          <div className="rounded-panel border border-hairline bg-paper px-6 py-5">
            <p className="text-[15px] font-bold">Explanation</p>
            <RichText
              source={values.explanation}
              className="mt-1.5 text-[15px] leading-relaxed text-ink-soft"
            />
          </div>
        ) : null}
      </div>
    </form>
  );
}
