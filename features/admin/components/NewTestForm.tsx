"use client";

import { useActionState, useState } from "react";
import { Button, ButtonLink } from "@/core/design/ui";
import { createTest, type SimpleState } from "../actions";

const inputClass =
  "w-full rounded-choice border-[1.5px] border-control bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-pine";
const DEFAULT_MINUTES: Record<string, number> = { english: 32, math: 35 };

export function NewTestForm() {
  const [state, action, pending] = useActionState(createTest, { message: null } as SimpleState);
  const [subject, setSubject] = useState("english");
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES.english);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-5 rounded-panel border border-hairline bg-paper p-6">
      <label className="flex flex-col gap-1.5">
        <span className="text-[15px] font-bold">Name</span>
        <input name="title" required placeholder="Practice test 2" className={inputClass} />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[15px] font-bold">Subject</span>
          <select
            name="subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setMinutes(DEFAULT_MINUTES[e.target.value] ?? 32);
            }}
            className={inputClass}
          >
            <option value="english">Reading and Writing</option>
            <option value="math">Math</option>
          </select>
        </label>
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
      </div>
      <p className="text-[15px] text-graphite">
        The test gets three empty modules: module 1, an easier module 2 and a harder module 2. It stays a draft until you publish it.
      </p>
      {state.message ? (
        <p role="alert" className="rounded-choice bg-wash px-4 py-3 text-[15px] font-bold">
          {state.message}
        </p>
      ) : null}
      <div className="flex gap-2.5">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create test"}
        </Button>
        <ButtonLink href="/admin" variant="quiet">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
