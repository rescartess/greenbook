"use client";

import { useMemo, useState } from "react";
import { cn } from "@/core/design/ui";
import { reviewState, ReviewScreen, type ReviewItem } from "./ReviewScreen";

export type OverviewItem = ReviewItem & { section: string; domain: string | null };
type SortKey = "number" | "answer" | "domain";
type PageSize = 10 | 30 | "all";

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

/**
 * "Questions Overview" after a finished practice or test (owner's reference, 27 Nov 2026):
 * totals with percentages, a table of every question (sortable, 10 / 30 / All per page),
 * the correct answers hidden until "Show Correct Answers" is on, and Review for each question.
 */
export function QuestionsOverview({
  items,
  title,
  studentName,
  subtitle = "Review your results for each question from this practice.",
}: {
  items: OverviewItem[];
  title: string;
  studentName: string;
  subtitle?: string;
}) {
  const [show, setShow] = useState(false);
  const [size, setSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: SortKey; up: boolean }>({ key: "number", up: true });
  const [open, setOpen] = useState<string | null>(null);

  const total = items.length;
  const correct = items.filter((q) => q.isCorrect).length;
  const incorrect = total - correct;

  const sorted = useMemo(() => {
    const value = (q: OverviewItem, i: number): string | number =>
      sort.key === "number" ? i : sort.key === "answer" ? (q.isCorrect ? 0 : q.answer ? 1 : 2) : (q.domain ?? "~");
    const rows = items.map((q, i) => ({ q, i, v: value(q, i) }));
    rows.sort((a, b) => (a.v < b.v ? -1 : a.v > b.v ? 1 : a.i - b.i) * (sort.up ? 1 : -1));
    return rows.map((r) => ({ q: r.q, n: r.i + 1 }));
  }, [items, sort]);

  const pages = size === "all" ? 1 : Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, pages);
  const shown = size === "all" ? sorted : sorted.slice((current - 1) * size, current * size);

  const sortBy = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, up: !s.up } : { key, up: true }));
    setPage(1);
  };

  return (
    <section className="mt-8 rounded-[14px] border border-hairline bg-paper px-4 py-7 sm:px-8 sm:py-9">
      <h2 className="text-[30px] font-bold leading-tight tracking-[-0.01em] sm:text-[36px]">Questions Overview</h2>
      <p className="mt-1 text-[17px]">{subtitle}</p>

      <dl className="mt-6 grid grid-cols-3 gap-2 sm:gap-5">
        <Total label="Total Questions" value={total} />
        <Total label="Correct Answers" value={correct} percent={pct(correct, total)} />
        <Total label="Incorrect Answers" value={incorrect} percent={pct(incorrect, total)} />
      </dl>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-3 text-[17px]">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="peer sr-only" />
          <span
            aria-hidden="true"
            className="relative h-8 w-[72px] rounded-full bg-graphite transition-colors peer-checked:bg-pine peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-pine after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-paper after:transition-transform peer-checked:after:translate-x-10"
          />
          Show Correct Answers
        </label>
        <p className="flex items-center gap-3 text-[17px]">
          View:
          {([10, 30, "all"] as const).map((v, i) => (
            <span key={String(v)} className="flex items-center gap-3">
              {i > 0 ? <span aria-hidden="true">|</span> : null}
              <button
                type="button"
                aria-pressed={size === v}
                onClick={() => {
                  setSize(v);
                  setPage(1);
                }}
                className={size === v ? "font-bold" : "text-pine underline underline-offset-2"}
              >
                {v === "all" ? "All" : v}
              </button>
            </span>
          ))}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-[15px] sm:text-[17px] md:min-w-[720px]">
          <thead className="bg-ink text-paper">
            <tr>
              <Head label="Question" sortKey="number" sort={sort} onSort={sortBy} />
              <th scope="col" className="hidden px-3 py-4 font-bold md:table-cell">Section</th>
              <th scope="col" className="px-3 py-4 font-bold">Correct Answer</th>
              <Head label="Your Answer" sortKey="answer" sort={sort} onSort={sortBy} />
              <th scope="col" className="px-3 py-4 font-bold">Actions</th>
              <Head label="Domain" sortKey="domain" sort={sort} onSort={sortBy} />
            </tr>
          </thead>
          <tbody>
            {shown.map(({ q, n }) => {
              const s = reviewState(q);
              return (
                <tr key={q.id} className="border-b border-control">
                  <td className="px-3 py-5 tabular-nums">{n}</td>
                  <td className="hidden px-3 py-5 md:table-cell">{q.section}</td>
                  <td className="bg-mist px-3 py-5 font-semibold">{show ? (q.correctAnswer ?? "") : ""}</td>
                  <td className={cn("px-3 py-5", s === "correct" ? "text-correct" : "text-incorrect")}>
                    {s === "correct" ? "Correct" : s === "wrong" ? "Incorrect" : "Omitted"}
                    {show && q.answer && s !== "correct" ? <span className="text-ink-soft">, you chose {q.answer}</span> : null}
                  </td>
                  <td className="px-3 py-5">
                    <button type="button" onClick={() => setOpen(q.id)} className="text-pine underline underline-offset-2 hover:no-underline">
                      Review
                    </button>
                  </td>
                  <td className="px-3 py-5">{q.domain ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 ? <Pager page={current} pages={pages} onPage={setPage} /> : null}

      {open ? (
        <ReviewScreen
          title={title}
          items={sorted.map((r) => r.q)}
          startId={open}
          startFilter="all"
          showAnswers={show}
          studentName={studentName}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </section>
  );
}

function Total({ label, value, percent }: { label: string; value: number; percent?: number }) {
  return (
    <div className="flex flex-col-reverse items-center rounded-[14px] bg-pine-tint px-2 py-4 ring-1 ring-hairline ring-inset sm:px-4 sm:py-6 text-center">
      <dt className="mt-1 text-[13px] font-bold leading-tight sm:text-[19px]">{label}</dt>
      <dd className="flex flex-wrap items-baseline justify-center gap-x-2 tabular-nums">
        <span className="text-[30px] font-bold leading-none sm:text-[48px]">{value}</span>
        {percent !== undefined ? <span className="text-[15px] font-semibold text-ink-soft sm:text-[22px]">{percent}%</span> : null}
      </dd>
    </div>
  );
}

function Head({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; up: boolean };
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  return (
    <th scope="col" aria-sort={active ? (sort.up ? "ascending" : "descending") : "none"} className="px-3 py-4 font-bold">
      <button type="button" onClick={() => onSort(sortKey)} className="flex w-full items-center justify-between gap-3">
        {label}
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {!active || sort.up ? <path d="M3 8l5-5 5 5" /> : null}
          {!active || !sort.up ? <path d="M3 12l5 5 5-5" /> : null}
        </svg>
      </button>
    </th>
  );
}

function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const list: (number | "gap")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) list.push(p);
    else if (list[list.length - 1] !== "gap") list.push("gap");
  }
  const cell = "flex h-14 min-w-14 items-center justify-center px-4 text-[17px]";
  return (
    <nav aria-label="Pages" className="mx-auto mt-10 flex w-fit overflow-hidden rounded-[6px] border-2 border-control">
      <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)} className={cn(cell, "disabled:opacity-40")}>
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M8 2L2 8l6 6" />
        </svg>
      </button>
      {list.map((p, i) =>
        p === "gap" ? (
          <span key={`gap${i}`} className={cn(cell, "bg-mist")}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPage(p)}
            className={cn(cell, "font-bold tabular-nums", p === page ? "bg-control" : "hover:bg-mist")}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" aria-label="Next page" disabled={page === pages} onClick={() => onPage(page + 1)} className={cn(cell, "disabled:opacity-40")}>
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M2 2l6 6-6 6" />
        </svg>
      </button>
    </nav>
  );
}
