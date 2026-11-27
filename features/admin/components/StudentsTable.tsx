"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type MouseEvent } from "react";
import { cn } from "@/core/design/ui";
import { SIGN_IN_LABEL, percent, timeLabel } from "../student-format";
import type { StudentRow } from "../students";
import { StudentAvatar, Tag } from "./StudentAvatar";

/** A row plus labels made on the server ("3 h ago"), so the page reads the same before and after it loads. */
export type TableRow = StudentRow & { lastActiveLabel: string; joinedLabel: string };

const SORTS = {
  active: { label: "Last active", by: (a: TableRow, b: TableRow) => (b.lastActive ?? "").localeCompare(a.lastActive ?? "") },
  time: { label: "Most time", by: (a: TableRow, b: TableRow) => b.seconds - a.seconds },
  answered: { label: "Most answered", by: (a: TableRow, b: TableRow) => b.answered - a.answered },
  newest: { label: "Newest", by: (a: TableRow, b: TableRow) => b.joined.localeCompare(a.joined) },
  name: { label: "Name", by: (a: TableRow, b: TableRow) => a.name.localeCompare(b.name) },
} as const;
type Sort = keyof typeof SORTS;

/** Everyone, with search and sort. Each row opens the student's page. */
export function StudentsTable({ rows }: { rows: TableRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("active");
  const router = useRouter();

  // The whole row opens the student. Not with a link stretched over the row (::after on a
  // `relative` <tr>): Safari ignores `relative` on table rows, so the last row's invisible
  // link covered the page and every click opened that student (bug found 28 Nov 2026).
  const openRow = (e: MouseEvent<HTMLTableRowElement>, href: string) => {
    if ((e.target as HTMLElement).closest("a, button, input")) return; // the name link handles itself
    if (window.getSelection()?.toString()) return; // selecting text (e.g. copying an email) isn't a click
    if (e.metaKey || e.ctrlKey || e.button === 1) window.open(href, "_blank", "noopener");
    else router.push(href);
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)) : rows;
    return [...found].sort(SORTS[sort].by);
  }, [rows, query, sort]);

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          aria-label="Search students"
          className="h-11 w-full rounded-[10px] border border-hairline bg-paper px-3.5 text-[16px] text-ink placeholder:text-graphite focus:border-pine focus:outline-none sm:max-w-[340px]"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-graphite">Sort</span>
          {(Object.keys(SORTS) as Sort[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={cn(
                "h-9 rounded-full px-3.5 text-[14px] font-semibold transition-colors",
                sort === key ? "bg-pine text-pine-ink" : "bg-paper text-ink ring-1 ring-inset ring-hairline hover:bg-mist",
              )}
            >
              {SORTS[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-graphite tabular-nums">
          {shown.length === rows.length ? `${rows.length} people` : `${shown.length} of ${rows.length}`}
        </p>
        <button type="button" onClick={() => downloadCsv(shown)} className="text-[14px] font-semibold text-pine underline-offset-4 hover:underline">
          Download list
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-[var(--fp-r-card)] border border-hairline bg-paper px-6 py-10 text-center text-[15px] text-graphite">
          No one matches “{query}”.
        </p>
      ) : (
        <>
          {/* Wide screens: a table. */}
          <div className="mt-3 hidden overflow-hidden rounded-[var(--fp-r-card)] border border-hairline bg-paper md:block">
            <table className="w-full text-left text-[14px]">
              <thead className="border-b border-hairline bg-mist/60 text-[13px] text-graphite">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-3 py-3 font-semibold">Last active</th>
                  <th className="px-3 py-3 text-right font-semibold">Time</th>
                  <th className="px-3 py-3 text-right font-semibold">Answered</th>
                  <th className="px-3 py-3 text-right font-semibold">Accuracy</th>
                  <th className="px-3 py-3 text-right font-semibold">Best English</th>
                  <th className="px-3 py-3 text-right font-semibold">Best Math</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr
                    key={r.id}
                    onClick={(e) => openRow(e, `/admin/students/${r.id}`)}
                    onAuxClick={(e) => openRow(e, `/admin/students/${r.id}`)}
                    className="cursor-pointer border-b border-hairline last:border-0 hover:bg-mist/70"
                  >
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/students/${r.id}`} className="flex items-center gap-3" aria-label={`Open ${r.name}`}>
                        <StudentAvatar url={r.avatarUrl} name={r.name} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-semibold text-ink">
                            <span className="truncate">{r.name}</span>
                            {r.admin ? <Tag strong>Admin</Tag> : null}
                          </span>
                          <span className="block truncate text-[13px] text-graphite">{r.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-graphite">{r.lastActiveLabel}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{timeLabel(r.seconds)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.answered}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{percent(r.correct, r.answered)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.bestEnglish ?? "–"}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.bestMath ?? "–"}</td>
                    <td className="px-4 py-2.5 text-graphite">
                      {r.joinedLabel}
                      <span className="block text-[12px]">{SIGN_IN_LABEL[r.via]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones: one card per student. */}
          <ul className="mt-3 space-y-2 md:hidden">
            {shown.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/students/${r.id}`}
                  className="block rounded-[var(--fp-r-card)] border border-hairline bg-paper p-4 active:bg-mist"
                >
                  <span className="flex items-center gap-3">
                    <StudentAvatar url={r.avatarUrl} name={r.name} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-semibold">
                        <span className="truncate">{r.name}</span>
                        {r.admin ? <Tag strong>Admin</Tag> : null}
                      </span>
                      <span className="block truncate text-[13px] text-graphite">{r.email}</span>
                    </span>
                    <span className="text-right text-[12px] text-graphite">{r.lastActiveLabel}</span>
                  </span>
                  <span className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
                    <Mini label="Time" value={timeLabel(r.seconds)} />
                    <Mini label="Answered" value={String(r.answered)} />
                    <Mini label="Accuracy" value={percent(r.correct, r.answered)} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-[10px] bg-mist px-2.5 py-1.5">
      <span className="block text-[11px] text-graphite">{label}</span>
      <span className="block font-bold tabular-nums">{value}</span>
    </span>
  );
}

/** The list as it is shown (search and sort included), as a file Excel and Google Sheets open. */
function downloadCsv(rows: TableRow[]) {
  const head = ["Name", "Email", "Role", "Signed in with", "Joined", "Last active", "Minutes practicing", "Answered", "Correct", "Accuracy", "Finished", "Best English", "Best Math"];
  const cell = (v: string | number | null) => {
    const s = v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [
      r.name,
      r.email,
      r.admin ? "admin" : "student",
      SIGN_IN_LABEL[r.via],
      r.joined.slice(0, 10),
      r.lastActive ? r.lastActive.slice(0, 16).replace("T", " ") : "",
      Math.round(r.seconds / 60),
      r.answered,
      r.correct,
      percent(r.correct, r.answered),
      r.finished,
      r.bestEnglish,
      r.bestMath,
    ]
      .map(cell)
      .join(","),
  );
  const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quantumtest-students-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
