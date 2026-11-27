"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ESTIMATED_SCORES } from "@/core/config/subjects";
import { cn } from "@/core/design/ui";
import { Empty, Note } from "@/core/shell";
import type { FullTestRow } from "../queries";
import { monthName } from "../schema";
import { StartTestButton } from "./StartTestButton";

/** Years always offered (owner request 28 Nov 2026), plus any other year a test is from. */
const BASE_YEARS = [2024, 2025, 2026];
const yearOf = (t: FullTestRow) => (t.month ? Number(t.month.slice(0, 4)) : null);

/**
 * Full tests with a year filter on top (owner request 28 Nov 2026): the year picks which months
 * the adaptive test offers and which month cards show. Starts on the newest year that has tests.
 * Tests without a month show under every year.
 */
export function FullTestsBrowser({ adaptive, fixed }: { adaptive: FullTestRow[]; fixed: FullTestRow[] }) {
  const all = [...adaptive, ...fixed];
  const withTests = all.map(yearOf).filter((y): y is number => y !== null);
  const years = [...new Set([...BASE_YEARS, ...withTests])].sort((a, b) => a - b);
  const [year, setYear] = useState(() => (withTests.length ? Math.max(...withTests) : years[years.length - 1]));
  const inYear = (t: FullTestRow) => yearOf(t) === null || yearOf(t) === year;
  const shownAdaptive = adaptive.filter(inYear);
  const shownFixed = fixed.filter(inYear);

  return (
    <div className="flex flex-col gap-8">
      <YearFilter years={years} year={year} onPick={setYear} />
      {shownAdaptive.length ? <AdaptivePicker key={year} tests={shownAdaptive} /> : null}
      {shownFixed.length ? (
        <section aria-labelledby="fixed-title" className="flex flex-col gap-4">
          <h2 id="fixed-title" className="text-[20px] font-bold">
            Tests by month
          </h2>
          <FixedTests tests={shownFixed} />
        </section>
      ) : null}
      {!shownAdaptive.length && !shownFixed.length ? <Empty title="Nothing yet.">{year} tests drop here.</Empty> : null}
    </div>
  );
}

/** 2024 · 2025 · 2026, in the same style as the English/Math switch. */
function YearFilter({ years, year, onPick }: { years: number[]; year: number; onPick: (y: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Year" className="flex w-fit rounded-[var(--fp-r-btn)] border border-pine-soft bg-pine-tint p-1">
      {years.map((y) => {
        const on = y === year;
        return (
          <button
            key={y}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onPick(y)}
            className={cn(
              "fp-label flex h-10 min-w-[84px] items-center justify-center rounded-[var(--fp-r-btn)] px-5 text-[16px] font-extrabold tabular-nums transition-colors",
              on ? "rp-btn-primary bg-pine text-pine-ink" : "text-pine hover:bg-paper/70",
            )}
          >
            {y}
          </button>
        );
      })}
    </div>
  );
}

/** Pick a month, then start its adaptive test: Module 1 decides whether Module 2 is easier or harder. */
function AdaptivePicker({ tests }: { tests: FullTestRow[] }) {
  const [id, setId] = useState(tests[0]?.id ?? "");
  const test = tests.find((t) => t.id === id) ?? tests[0];
  if (!test) return null;
  return (
    <section aria-labelledby="adaptive-title" className="rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper p-5 sm:p-6">
      <h2 id="adaptive-title" className="text-[20px] font-bold">
        Adaptive full test
      </h2>
      <p className="mt-1 max-w-[60ch] text-[15px] text-graphite">Pick a month. Module 1 decides the rest.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5 sm:w-64">
          <span id="month-label" className="text-[14px] font-semibold text-ink-soft">
            Month
          </span>
          <MonthPicker labelledBy="month-label" tests={tests} value={test.id} onChange={setId} />
        </div>
        <div className="sm:w-64">
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

/**
 * Our own month dropdown instead of the browser's (owner: the browser's looked cheap): the same
 * height, width and colors as the buttons next to it, in every design. Keyboard: arrows, Enter, Esc.
 */
function MonthPicker({
  tests,
  value,
  onChange,
  labelledBy,
}: {
  tests: FullTestRow[];
  value: string;
  onChange: (id: string) => void;
  labelledBy: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, tests.findIndex((t) => t.id === value)));
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const current = tests.find((t) => t.id === value) ?? tests[0];

  // Close when clicking anywhere else.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const choose = (i: number) => {
    const t = tests[i];
    if (t) onChange(t.id);
    setOpen(false);
  };
  const openList = () => {
    setActive(Math.max(0, tests.findIndex((t) => t.id === value)));
    setOpen(true);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openList();
      setActive((i) => Math.min(tests.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(active);
      else openList();
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : tests.length - 1);
    }
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelledBy}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKey}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-3 rounded-[var(--fp-r-btn)] border bg-mist pl-[18px] pr-3.5 text-left text-[15px] font-bold text-ink transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine",
          open ? "border-pine-soft bg-pine-tint" : "border-hairline hover:border-pine-soft hover:bg-pine-tint",
        )}
      >
        <span className="truncate">
          {monthName(current)}
          {current.published ? "" : " (draft)"}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("shrink-0 text-pine transition-transform", open && "rotate-180")}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-labelledby={labelledBy}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-[300px] overflow-y-auto rounded-[min(var(--fp-r-card),16px)] border border-hairline bg-paper p-1.5 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.45)]"
        >
          {tests.map((t, i) => {
            const selected = t.id === value;
            return (
              <li
                key={t.id}
                id={`${listId}-${i}`}
                data-i={i}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-[min(var(--fp-r-btn),10px)] px-3 py-2.5 text-[15px]",
                  i === active ? "bg-pine-tint text-ink" : "text-ink-soft",
                  selected && "font-bold text-ink",
                )}
              >
                <span>
                  {monthName(t)}
                  {t.published ? "" : " (draft)"}
                </span>
                {selected ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-pine">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function FixedTests({ tests }: { tests: FullTestRow[] }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      {tests.map((test) => {
        const letter = /\s([A-Z])$/.exec(test.title)?.[1] ?? null;
        return (
          <li key={test.id}>
            <article className="flex h-full flex-col rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[18px] font-bold leading-snug">{test.month ? monthName(test) : test.title}</h3>
                {letter ? (
                  <span
                    aria-label={`Version ${letter}`}
                    className="grid h-7 min-w-7 place-items-center rounded-[8px] border border-pine px-1.5 text-[14px] font-bold text-pine"
                  >
                    {letter}
                  </span>
                ) : null}
              </div>
              <ul className="mt-2 text-[15px] text-ink-soft">
                {test.moduleNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <p className="mt-3 text-[14px] text-graphite tabular-nums">
                {test.last
                  ? `Last score ${test.last.score ?? `${test.last.raw} correct`}${test.last.score && ESTIMATED_SCORES ? " (estimated)" : ""}`
                  : "Not taken yet"}
              </p>
              {!test.published ? (
                <p className="mt-1">
                  <Note>Draft, only you can see it</Note>
                </p>
              ) : null}
              <div className="mt-auto pt-5">
                <StartTestButton setId={test.id} label={test.inProgressId ? "Continue exam" : "Start exam"} />
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
