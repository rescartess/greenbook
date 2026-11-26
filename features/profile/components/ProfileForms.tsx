"use client";

import { useActionState } from "react";
import { Btn } from "@/core/shell";
import { NAME_MAX, TARGET_MAX, TARGET_MIN, daysUntil, type ProfileFormState } from "../schema";
import { saveName, saveTarget, saveTestDate } from "../actions";

const START: ProfileFormState = { ok: false, message: null };
const INPUT =
  "h-10 min-w-0 flex-1 rounded-[10px] border border-hairline bg-paper px-3 text-[15px] text-ink placeholder:text-graphite focus:border-pine focus:outline-none";

function Status({ state }: { state: ProfileFormState }) {
  if (!state.message) return null;
  return (
    <p role="status" className={state.ok ? "text-[13px] font-semibold text-pine" : "text-[13px] font-semibold text-ink"}>
      {state.message}
    </p>
  );
}

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(saveName, START);
  return (
    <form action={action} className="grid gap-1.5 border-t border-hairline py-4">
      <label htmlFor="profile-name" className="text-[14px] font-semibold">
        Name
      </label>
      <div className="flex gap-2.5">
        <input id="profile-name" name="name" defaultValue={name} maxLength={NAME_MAX} autoComplete="name" className={INPUT} />
        <Btn type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Btn>
      </div>
      <p className="text-[13px] text-graphite">Shown in your menu and on the test screen</p>
      <Status state={state} />
    </form>
  );
}

export function TargetForm({ target }: { target: number | null }) {
  const [state, action, pending] = useActionState(saveTarget, START);
  return (
    <form action={action} className="grid gap-1.5 border-t border-hairline py-4">
      <label htmlFor="profile-target" className="text-[14px] font-semibold">
        Target score
      </label>
      <div className="flex gap-2.5">
        <input
          id="profile-target"
          name="target"
          type="number"
          inputMode="numeric"
          min={TARGET_MIN}
          max={TARGET_MAX}
          step={10}
          defaultValue={target ?? ""}
          placeholder="For example 1400"
          className={`${INPUT} tabular-nums`}
        />
        <Btn type="submit" tone="quiet" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Btn>
      </div>
      <p className="text-[13px] text-graphite">
        Your SAT total goal, {TARGET_MIN} to {TARGET_MAX}
      </p>
      <Status state={state} />
    </form>
  );
}

export function TestDateForm({ date, today }: { date: string | null; today: string }) {
  const [state, action, pending] = useActionState(saveTestDate, START);
  const left = date ? daysUntil(date, today) : null;
  return (
    <form action={action} className="grid gap-1.5 border-t border-hairline pt-4">
      <label htmlFor="profile-test-date" className="text-[14px] font-semibold">
        SAT date
      </label>
      <div className="flex gap-2.5">
        <input id="profile-test-date" name="testDate" type="date" min="2024-01-01" max="2035-12-31" defaultValue={date ?? ""} className={`${INPUT} tabular-nums`} />
        <Btn type="submit" tone="quiet" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Btn>
      </div>
      <p className="text-[13px] text-graphite tabular-nums">
        {left === null
          ? "When you take the real test"
          : left > 1
            ? `${left} days left`
            : left === 1
              ? "Tomorrow. Good luck"
              : left === 0
                ? "Today. Good luck"
                : "This date has passed. Set your next one"}
      </p>
      <Status state={state} />
    </form>
  );
}
