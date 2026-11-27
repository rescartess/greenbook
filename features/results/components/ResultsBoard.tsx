"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useSyncExternalStore } from "react";
import { cn } from "@/core/design/ui";
import { Btn } from "@/core/shell";
import { cardView, type AttemptSummary } from "../schema";

type Filter = "all" | "finished" | "unfinished";
type RetakeAction = (attemptId: string, prev: { message: string | null }, form: FormData) => Promise<{ message: string | null }>;

const noop = () => () => {};
/** True after the page has loaded in the browser, so times show in the student's own time zone. */
const useInBrowser = () => useSyncExternalStore(noop, () => true, () => false);

function when(iso: string, inBrowser: boolean) {
  if (!iso) return "";
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: inBrowser ? undefined : "UTC" }).format(d);
  if (!inBrowser) return day;
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
  return `${day}, ${time}`;
}

/** Results: one card per test or practice, with a search box and Finished / Unfinished filters. */
export function ResultsBoard({ subject, attempts, retake }: { subject: string; attempts: AttemptSummary[]; retake: RetakeAction }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const inBrowser = useInBrowser();

  const counts = useMemo(
    () => ({
      all: attempts.length,
      finished: attempts.filter((a) => a.status === "completed").length,
      unfinished: attempts.filter((a) => a.status !== "completed").length,
    }),
    [attempts],
  );
  const q = query.trim().toLowerCase();
  const shown = attempts.filter(
    (a) =>
      (filter === "all" || (filter === "finished") === (a.status === "completed")) &&
      (!q || (a.name ?? "").toLowerCase().includes(q) || a.setTitle.toLowerCase().includes(q)),
  );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 sm:max-w-sm">
          <span className="sr-only">Search results</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
            className="h-10 w-full rounded-[10px] border border-hairline bg-paper pl-9 pr-3 text-[15px] outline-none placeholder:text-graphite focus:border-pine"
          />
        </label>
        <div role="radiogroup" aria-label="Show" className="flex rounded-[10px] border border-hairline bg-mist p-[3px]">
          {(
            [
              ["all", "All"],
              ["finished", "Finished"],
              ["unfinished", "Unfinished"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "flex items-baseline gap-1.5 rounded-[7px] px-3.5 py-1.5 text-[14px] font-semibold transition-colors",
                filter === value ? "bg-paper text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-hairline" : "text-ink-soft hover:text-ink",
              )}
            >
              {label}
              <span className="text-[13px] font-medium text-graphite tabular-nums">{counts[value]}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper px-6 py-10 text-[15px] text-ink-soft">
          {q ? `Nothing called “${query.trim()}”.` : filter === "unfinished" ? "Nothing unfinished. Everything you started is done." : "Nothing here yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-4">
          {shown.map((a) => (
            <li key={a.id}>
              <ResultCard attempt={a} subject={subject} when={when(a.startedAt, inBrowser)} retake={retake} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ResultCard({ attempt, subject, when, retake }: { attempt: AttemptSummary; subject: string; when: string; retake: RetakeAction }) {
  const v = cardView(attempt, subject);
  const [state, action, pending] = useActionState(retake.bind(null, attempt.id), { message: null });
  return (
    <article className="flex h-full flex-col rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-graphite tabular-nums">{when}</p>
        <span
          className={cn(
            "rounded-[6px] px-2 py-0.5 text-[13px] font-semibold",
            v.finished ? "bg-pine-tint text-pine" : "border border-hairline bg-mist text-ink-soft",
          )}
        >
          {v.finished ? "Finished" : "Unfinished"}
        </span>
      </div>
      <h2 className="mt-2.5 text-[18px] font-bold leading-snug">{v.title}</h2>
      <p className="mt-0.5 text-[14px] text-graphite">{v.subtitle}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2.5">
        {v.stats.map((s) => (
          <div key={s.label} className="rounded-[10px] bg-mist px-3.5 py-3">
            <dt className="text-[13px] font-medium text-ink-soft">{s.label}</dt>
            <dd className="mt-1 flex items-baseline gap-1.5 tabular-nums">
              <span className="text-[24px] font-bold leading-none">{s.value}</span>
              {s.of ? <span className="text-[13px] text-graphite">{s.of}</span> : null}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-3 grid gap-3 rounded-[10px] border border-hairline px-3.5 py-3">
        {v.rows.map((r) => (
          <li key={r.label}>
            <p className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="truncate text-ink-soft">{r.label}</span>
              <span className="font-semibold tabular-nums">{r.value}</span>
            </p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-mist" aria-hidden="true">
              <div className={cn("h-full rounded-full", v.finished ? "rp-rainbow-bar" : "bg-graphite/45")} style={{ width: `${r.share * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex gap-2.5 pt-5">
        <Link
          href={v.primary.href}
          className="inline-flex h-10 flex-1 items-center justify-center rp-btn-primary fp-label rounded-[var(--fp-r-btn)] bg-pine text-[15px] font-bold text-pine-ink transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
        >
          {v.primary.label}
        </Link>
        {v.canRetake ? (
          <form action={action} className="flex flex-1">
            <Btn type="submit" tone="quiet" disabled={pending} className="w-full">
              {pending ? "Starting…" : "Retake"}
            </Btn>
          </form>
        ) : null}
      </div>
      {state.message ? (
        <p role="alert" className="mt-2 text-[13px] font-semibold">
          {state.message}
        </p>
      ) : null}
    </article>
  );
}
