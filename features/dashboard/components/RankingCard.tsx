import Link from "next/link";
import { cn } from "@/core/design/ui";
import { Card } from "@/core/shell";
import { ordinal } from "../banner";
import type { Leaderboard, RankRow } from "../queries";

/** "64h 29m", or "12m" under an hour. */
function hours(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

/** Up to this many rows, the list sits still; more, and it drifts up on its own. */
const STILL = 4;

/**
 * The leaderboard on the dashboard (owner request 27 Nov 2026): everyone by time practicing,
 * scrolling up on its own like a ticker, pausing under the pointer. Each name opens that
 * student's profile. The student's own row is marked.
 */
export function RankingCard({ board, subject, className }: { board: Leaderboard; subject: string; className?: string }) {
  const mine = board.rows.find((r) => r.me);
  const moving = board.rows.length > STILL;
  const rows = moving ? [...board.rows, ...board.rows] : board.rows;
  return (
    <Card flush className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-baseline justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
        <h2 className="text-[17px] font-bold">Leaderboard</h2>
        {mine ? (
          <p className="text-[13px] text-graphite tabular-nums">
            You: <span className="font-bold text-ink">{ordinal(mine.rank)}</span> of {board.students}
          </p>
        ) : null}
      </div>
      {board.rows.length === 0 ? (
        <p className="px-6 pb-6 text-[15px] text-graphite">Empty. For now.</p>
      ) : (
        <div className="fp-ticker group relative h-[232px] overflow-hidden motion-reduce:overflow-y-auto">
          <ol
            className={cn("px-3", moving && "fp-ticker-run group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]")}
            style={moving ? { animationDuration: `${board.rows.length * 2.6}s` } : undefined}
          >
            {rows.map((r, i) => (
              <Row key={`${r.id}-${i}`} row={r} subject={subject} copy={i >= board.rows.length} />
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}

function Row({ row, subject, copy }: { row: RankRow; subject: string; copy: boolean }) {
  const initials = row.name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <li aria-hidden={copy || undefined}>
      <Link
        href={`/${subject}/students/${row.id}`}
        tabIndex={copy ? -1 : undefined}
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
        <span className="shrink-0 font-mono text-[13px] text-graphite tabular-nums">{hours(row.seconds)}</span>
      </Link>
    </li>
  );
}
