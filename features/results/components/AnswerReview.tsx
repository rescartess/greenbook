"use client";

import { useState } from "react";
import { Button, cn, Icon } from "@/core/design/ui";
import {
  QuestionMapGrid,
  REVIEW_FILTERS,
  ReviewScreen,
  filterCounts,
  matchesFilter,
  reviewState,
  type ReviewFilter,
  type ReviewItem,
} from "@/core/question";

type Group = { label: string; items: ReviewItem[] };

/** "Review your answers": filter tabs, one grid of question squares per module, and the Bluebook review. */
export function AnswerReview({ title, groups, studentName }: { title: string; groups: Group[]; studentName: string }) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [open, setOpen] = useState<null | { id?: string; filter: ReviewFilter }>(null);
  const all = groups.flatMap((g) => g.items);
  const counts = filterCounts(all);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight">Review your answers</h2>
        <Button onClick={() => setOpen({ filter })} disabled={counts[filter] === 0}>
          Review questions
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-hairline">
        <div role="tablist" aria-label="Show questions" className="flex gap-1 overflow-x-auto">
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
        <div className="flex flex-wrap gap-x-4 gap-y-1 pb-2.5 text-[13px] text-ink-soft">
          <Legend className="bg-correct">Correct</Legend>
          <Legend className="bg-incorrect">Incorrect</Legend>
          <Legend className="border-[1.5px] border-dashed border-ink-soft">Skipped</Legend>
          <span className="flex items-center gap-1.5">
            <Icon name="bookmark" size={14} className="text-pine" /> For review
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {groups.map((g) => {
          const items = g.items.filter((q) => matchesFilter(q, filter));
          return (
            <div key={g.label} className="rounded-panel border border-hairline bg-paper p-5">
              <p className="mb-3 font-bold">{g.label}</p>
              {items.length === 0 ? (
                <p className="text-[14px] text-graphite">Nothing here.</p>
              ) : (
                <QuestionMapGrid
                  legend={false}
                  items={items.map((q) => ({ id: q.id, number: q.number, state: reviewState(q), marked: q.marked }))}
                  onPick={(id) => setOpen({ id, filter })}
                />
              )}
            </div>
          );
        })}
      </div>

      {open ? (
        <ReviewScreen
          title={title}
          items={all}
          startId={open.id}
          startFilter={open.filter}
          studentName={studentName}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </section>
  );
}

function Legend({ className, children }: { className: string; children: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-3.5 w-3.5 rounded", className)} /> {children}
    </span>
  );
}
