"use client";

import { useState } from "react";
import { ESTIMATED_SCORES } from "@/core/config/subjects";
import { Note } from "@/core/shell";
import type { FullTestRow } from "../queries";
import { monthName } from "../schema";
import { StartTestButton } from "./StartTestButton";


/** Pick a month, then start its adaptive test: Module 1 decides whether Module 2 is easier or harder. */
export function AdaptivePicker({ tests }: { tests: FullTestRow[] }) {
  const [id, setId] = useState(tests[0]?.id ?? "");
  const test = tests.find((t) => t.id === id) ?? tests[0];
  if (!test) return null;
  return (
    <section aria-labelledby="adaptive-title" className="rounded-[14px] border border-hairline bg-paper p-5 sm:p-6">
      <h2 id="adaptive-title" className="text-[20px] font-bold">Adaptive full test</h2>
      <p className="mt-1 max-w-[60ch] text-[15px] text-graphite">
        Choose a month. Your Module 1 score decides whether Module 2 is easier or harder, like on test day.
      </p>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1.5 sm:w-72">
          <span className="text-[14px] font-semibold text-ink-soft">Month</span>
          <select
            value={test.id}
            onChange={(e) => setId(e.target.value)}
            className="h-11 rounded-[10px] border border-hairline bg-paper px-3 text-[16px] font-semibold"
          >
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {monthName(t)}
                {t.published ? "" : " (draft)"}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:w-56">
          <StartTestButton key={test.id} setId={test.id} label={test.inProgressId ? "Continue exam" : "Start exam"} />
        </div>
      </div>
      <p className="mt-3 text-[14px] text-graphite tabular-nums">
        {test.last
          ? `Last score ${test.last.score ?? `${test.last.raw} correct`}${test.last.score && ESTIMATED_SCORES ? " (estimated)" : ""}`
          : "Not taken yet"}
      </p>
      {!test.published ? (
        <p className="mt-2">
          <Note>Draft, only you can see it</Note>
        </p>
      ) : null}
    </section>
  );
}
