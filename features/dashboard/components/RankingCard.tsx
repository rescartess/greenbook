import Link from "next/link";
import { isSubjectSlug, SUBJECTS } from "@/core/config/subjects";
import { cn } from "@/core/design/ui";
import { Card } from "@/core/shell";
import { ordinal } from "../banner";
import type { Leaderboard, RankRow } from "../queries";
import { RankingScroller } from "./RankingScroller";

/** Below first place, up to this many rows sit still; more, and the list drifts on its own. */
const STILL = 3;

/**
 * The leaderboard on the dashboard (owner request 27 Nov 2026): everyone by questions answered
 * correctly in this subject (owner request 28 Nov 2026: English page by English, Math page by Math),
 * first place pinned on top (owner request 27 Nov 2026: no wrap-around), everyone else below it
 * in a box that scrolls by hand and drifts down on its own (RankingScroller). Each name opens that
 * student's profile. The student's own row is marked.
 */
export function RankingCard({ board, subject, className }: { board: Leaderboard; subject: string; className?: string }) {
  const mine = board.rows.find((r) => r.me);
  const [first, ...rest] = board.rows;
  const label = isSubjectSlug(subject) ? SUBJECTS[subject].label : "";
  return (
    <Card flush className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-baseline justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
        <div>
          <h2 className="text-[17px] font-bold">Leaderboard</h2>
          <p className="text-[13px] text-graphite">Most correct{label ? ` in ${label}` : ""}</p>
        </div>
        {mine ? (
          <p className="text-[13px] text-graphite tabular-nums">
            You: <span className="font-bold text-ink">{ordinal(mine.rank)}</span> of {board.students}
          </p>
        ) : null}
      </div>
      {board.rows.length === 0 ? (
        <p className="px-6 pb-6 text-[15px] text-graphite">Empty. For now.</p>
      ) : (
        <ol className="px-3 pb-3">
          {first ? <Row row={first} subject={subject} /> : null}
          {rest.length ? (
            <li className="mt-1 border-t border-hairline pt-1">
              <RankingScroller moving={rest.length > STILL} className="max-h-[184px]">
                <ol start={2}>
                  {rest.map((r) => (
                    <Row key={r.id} row={r} subject={subject} />
                  ))}
                </ol>
              </RankingScroller>
            </li>
          ) : null}
        </ol>
      )}
    </Card>
  );
}

function Row({ row, subject }: { row: RankRow; subject: string }) {
  const initials = row.name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <li>
      <Link
        href={`/${subject}/students/${row.id}`}
        className={cn(
          "flex items-center gap-3 rounded-[12px] px-3 py-2 transition-colors hover:bg-mist",
          row.me && "bg-pine-tint ring-1 ring-inset ring-pine-soft hover:bg-pine-tint",
        )}
      >
        <span className={cn("w-7 shrink-0 text-right text-[14px] font-bold tabular-nums", row.rank <= 3 ? "text-pine" : "text-graphite")}>{row.rank}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mist text-[11px] font-bold text-ink-soft ring-1 ring-hairline">
          {row.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- small public photo
            <img src={row.avatarUrl} alt="" width={32} height={32} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            initials || "?"
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
          {row.name}
          {row.me ? <span className="ml-1.5 text-[12px] font-semibold text-pine">you</span> : null}
        </span>
        <span className="shrink-0 font-mono text-[13px] text-graphite tabular-nums" aria-label={`${row.correct} correct`}>
          {row.correct.toLocaleString("en-US")}
        </span>
      </Link>
    </li>
  );
}
