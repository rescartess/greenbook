"use client";

import { useActionState, useState } from "react";
import { Button, ButtonLink } from "@/core/design/ui";
import { createTest, type SimpleState } from "../actions";
import type { SkillGroup } from "../queries";

const inputClass =
  "w-full rounded-choice border-[1.5px] border-control bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-pine";
const DEFAULT_MINUTES: Record<string, number> = { english: 32, math: 35 };

const KINDS = [
  { value: "full_test", label: "Full test", hint: "Module 1, then an easier or harder module 2, timed and scored 200–800." },
  { value: "topic", label: "Topic set", hint: "Untimed practice for one skill, with an explanation after every answer." },
  { value: "monthly", label: "Monthly set", hint: "Untimed practice listed under its month on the By month page." },
] as const;

export function NewTestForm({ skills }: { skills: Record<"english" | "math", SkillGroup[]> }) {
  const [state, action, pending] = useActionState(createTest, { message: null } as SimpleState);
  const [kind, setKind] = useState<string>("full_test");
  const [subject, setSubject] = useState<"english" | "math">("english");
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES.english);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-5 rounded-panel border border-hairline bg-paper p-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[15px] font-bold">What are you making?</legend>
        {KINDS.map((k) => (
          <label
            key={k.value}
            className="flex cursor-pointer items-start gap-3 rounded-choice border-[1.5px] border-control px-4 py-3 has-[:checked]:border-pine has-[:checked]:bg-pine-tint"
          >
            <input
              type="radio"
              name="kind"
              value={k.value}
              checked={kind === k.value}
              onChange={() => setKind(k.value)}
              className="mt-1 h-4 w-4 accent-pine"
            />
            <span>
              <span className="block font-bold">{k.label}</span>
              <span className="block text-[15px] text-graphite">{k.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-[15px] font-bold">Name</span>
        <input
          name="title"
          required
          placeholder={kind === "full_test" ? "Practice test 2" : kind === "topic" ? "Transitions, set 1" : "November 2025 questions"}
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[15px] font-bold">Subject</span>
          <select
            name="subject"
            value={subject}
            onChange={(e) => {
              const next = e.target.value === "math" ? "math" : "english";
              setSubject(next);
              setMinutes(DEFAULT_MINUTES[next]);
            }}
            className={inputClass}
          >
            <option value="english">Reading and Writing</option>
            <option value="math">Math</option>
          </select>
        </label>

        {kind === "full_test" ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-[15px] font-bold">Minutes per module</span>
            <input
              name="minutes"
              type="number"
              min={1}
              max={180}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className={inputClass}
            />
          </label>
        ) : kind === "monthly" ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-[15px] font-bold">Month</span>
            <input name="month" type="month" required className={inputClass} />
          </label>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-[15px] font-bold">Topic</span>
            <select name={`skillId_${subject}`} defaultValue="" required className={inputClass} key={subject}>
              <option value="" disabled>
                Pick a topic
              </option>
              {skills[subject].map((group) => (
                <optgroup key={group.domain} label={group.domain}>
                  {group.skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className="text-[15px] text-graphite">
        {kind === "full_test"
          ? "It gets three empty modules: module 1, an easier module 2 and a harder module 2."
          : "It gets one list of questions."}{" "}
        It stays a draft until you publish it.
      </p>
      {state.message ? (
        <p role="alert" className="rounded-choice bg-wash px-4 py-3 text-[15px] font-bold">
          {state.message}
        </p>
      ) : null}
      <div className="flex gap-2.5">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create"}
        </Button>
        <ButtonLink href="/admin" variant="quiet">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
