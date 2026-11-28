import { cn } from "@/core/design/ui";
import { ScoreScale } from "@/core/shell";

/**
 * The home page's product pieces (owner request 28 Nov 2026: the founder's photos came off the home page,
 * the site's features took their place; the hero shows the dashboard profile and leaderboard). Everything shown is something the site really does; numbers
 * are a sample student's, marked as a sample for screen readers. Desmos is not shown until its key is set.
 */

const BOARD: [number, string, string, number, boolean][] = [
  [1, "Madina Y.", "MY", 11420, false],
  [2, "Timur A.", "TA", 8375, false],
  [3, "Aziza K.", "AK", 6450, true],
  [4, "Dilnoza R.", "DR", 5283, false],
  [5, "Sardor Y.", "SY", 4192, false],
];

/**
 * Hero (owner request 28 Nov 2026: "show off the unique dashboard profile stats + leaderboard"): the
 * dashboard's profile banner and the leaderboard, drawn like the real ones (ProfileBanner and
 * RankingCard in features/dashboard) with a sample student, tilted, the leaderboard floating on its corner.
 */
export function HeroStack() {
  return (
    <div
      role="img"
      aria-label="A sample student's dashboard: photo, name, latest score, time practicing, questions answered, best full test, bio, all-time ranking and the leaderboard"
      className="fp-stack relative mx-auto w-full max-w-[700px] sm:pb-24 xl:pb-16"
    >
      <div className="fp-tilt grid gap-2.5 rounded-[18px] font-mono">
        <section className="rounded-[14px] border border-hairline bg-paper p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <span className="fp-avatar flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-[22px] font-bold ring-2 ring-pine/60 ring-offset-2 ring-offset-paper">AK</span>
            <div className="min-w-0">
              <p className="truncate text-[26px] leading-tight text-ink sm:text-[30px]">Aziza K.</p>
              <p className="mt-1 text-[13px] text-graphite">Joined 24 Nov 2026</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 text-[14px] tabular-nums">
            <span className="text-[18px] text-ink">690</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-mist">
              <span className="block h-full rounded-full bg-pine" style={{ width: `${((690 - 200) / 600) * 100}%` }} />
            </span>
            <span className="text-graphite">latest +80/800</span>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-hairline pt-5 sm:gap-3">
            {[
              ["time practicing", "64:29:44"],
              ["questions answered", "9,010"],
              ["best full test", "720"],
            ].map(([l, v]) => (
              <div key={l} className="flex min-w-0 flex-col">
                <dt className="text-[11px] leading-tight text-graphite sm:text-[12px]">{l}</dt>
                <dd className="text-[16px] leading-tight text-ink tabular-nums sm:text-[26px]">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 rounded-[12px] bg-mist px-4 py-3">
            <p className="text-[12px] text-graphite">bio</p>
            <p className="mt-0.5 text-[15px] text-ink">Faster than the speed of light.</p>
          </div>
        </section>
        <section className="flex items-center gap-4 rounded-[14px] border border-hairline bg-paper px-5 py-4 sm:px-6">
          <p className="flex items-baseline gap-2">
            <span className="text-[36px] leading-none text-ink tabular-nums">3rd</span>
            <span className="text-[12px] text-graphite tabular-nums">of 41</span>
          </p>
          <div className="min-w-0 text-[12px] leading-snug text-graphite sm:text-[13px]">
            <p className="text-ink-soft">All-time ranking</p>
            <p>6,450 correct · Top 8%</p>
          </div>
        </section>
      </div>

      <div className="fp-float relative mt-3 rounded-[18px] border border-hairline bg-paper p-2 pt-4 sm:absolute sm:-bottom-10 sm:-right-8 sm:mt-0 sm:w-[300px] xl:-bottom-14 xl:-right-16 xl:w-[290px]">
        <div className="flex items-baseline justify-between gap-3 px-3 pb-2">
          <div>
            <p className="text-[16px] font-bold">Leaderboard</p>
            <p className="text-[12px] text-graphite">Most correct in English</p>
          </div>
          <p className="text-[12px] text-graphite tabular-nums">
            You: <span className="font-bold text-ink">3rd</span>
          </p>
        </div>
        <ol>
          {BOARD.map(([rank, name, initials, correct, me]) => (
            <li
              key={rank}
              className={cn(
                "flex items-center gap-3 rounded-[12px] px-3 py-1.5",
                me && "bg-pine-tint ring-1 ring-inset ring-pine-soft",
                rank === 2 && "mt-1 border-t border-hairline pt-2",
              )}
            >
              <span className={cn("w-4 shrink-0 text-right text-[13px] font-bold tabular-nums", rank <= 3 ? "text-pine" : "text-graphite")}>{rank}</span>
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-1 ring-hairline", me ? "fp-avatar" : "bg-mist text-ink-soft")}>{initials}</span>
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
                {name}
                {me ? <span className="ml-1.5 text-[11px] font-semibold text-pine">you</span> : null}
              </span>
              <span className="shrink-0 font-mono text-[12px] text-graphite tabular-nums">{correct.toLocaleString("en-US")}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Module 1 → Hard / Easy, the adaptive step. */
function Route({ big = false }: { big?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 font-semibold", big ? "text-[15px]" : "text-[13px]")}>
      <span className="rounded-[8px] border border-hairline bg-mist px-2.5 py-1">Module 1</span>
      <svg width={big ? 34 : 24} height="24" viewBox="0 0 34 24" fill="none" aria-hidden="true" className="shrink-0 text-graphite">
        <path d="M2 12h10c6 0 8-8 14-8h4M12 12c6 0 8 8 14 8h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="flex flex-col gap-1.5">
        <span className="rp-btn-primary rounded-[8px] bg-pine px-2.5 py-1 text-pine-ink">Module 2 · Hard</span>
        <span className="rounded-[8px] border border-dashed border-hairline px-2.5 py-1 text-graphite">Module 2 · Easy</span>
      </span>
    </div>
  );
}

function Tile({ title, line, className, children }: { title: string; line: string; className?: string; children: React.ReactNode }) {
  return (
    <article className={cn("fp-tile flex flex-col justify-between gap-8 rounded-[24px] border border-hairline bg-paper p-6 sm:p-7", className)}>
      <div aria-hidden="true">{children}</div>
      <div>
        <h3 className="text-[26px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[30px]">{title}</h3>
        <p className="mt-2 text-[15px] text-graphite">{line}</p>
      </div>
    </article>
  );
}

const TOOLS = ["Highlight", "Mark for Review", "Directions", "Reference"];
const TOPICS = ["Words in Context", "Inferences", "Transitions", "Linear functions", "Circles", "Percentages"];
const MISSED = [
  ["Boundaries", "Hard"],
  ["Nonlinear functions", "Medium"],
  ["Inferences", "Hard"],
];

/** "Why us?": six things the site does, each with a small real piece of it. */
export function FeatureGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <Tile title="Bluebook. Cloned." line="Same screen. Same tools. Same clock." className="sm:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          {TOOLS.map((t, i) => (
            <span key={t} className={cn("rounded-[8px] border border-hairline px-3 py-1.5 text-[13px] font-semibold", i === 0 ? "underline decoration-2 underline-offset-[6px]" : "text-ink-soft")}>
              {t}
            </span>
          ))}
          <span className="ml-auto rounded-[8px] bg-mist px-3 py-1.5 text-[18px] font-bold tabular-nums">31:42</span>
        </div>
        <p className="mt-5 font-serif text-[17px] leading-relaxed text-ink-soft">
          The ants judge distance by <span className="fp-hl rounded-[3px] bg-hl-yellow px-0.5">counting steps</span>, a method that is ______.
        </p>
      </Tile>

      <Tile title="Adaptive." line="Module 1 decides Module 2.">
        <Route big />
      </Tile>

      <Tile title="200 to 800." line="Every full test, scored.">
        <p className="text-[44px] font-extrabold leading-none tracking-[-0.04em] tabular-nums">690</p>
        <div className="mt-4">
          <ScoreScale value={690} earlier={610} />
        </div>
      </Tile>

      <Tile title="College Board questions." line="The official question bank. Credited.">
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map((t) => (
            <span key={t} className="rounded-full border border-hairline px-3 py-1 text-[13px] text-ink-soft">
              {t}
            </span>
          ))}
        </div>
      </Tile>

      <Tile title="Mistakes don’t leave." line="Every miss, saved. Until you fix it.">
        <ul className="flex flex-col gap-2">
          {MISSED.map(([topic, level]) => (
            <li key={topic} className="flex items-center gap-3 rounded-[12px] bg-mist px-3 py-2 text-[14px]">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-incorrect text-[11px] font-bold text-paper">✕</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{topic}</span>
              <span className="text-graphite">{level}</span>
            </li>
          ))}
        </ul>
      </Tile>

      <Tile title="Full tests. By month." line="All of it, or one module." className="sm:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex rounded-[var(--fp-r-btn)] border border-pine-soft bg-pine-tint p-1">
            {["2024", "2025", "2026"].map((y) => (
              <span key={y} className={cn("rounded-[var(--fp-r-btn)] px-4 py-1.5 text-[14px] font-extrabold tabular-nums", y === "2025" ? "rp-btn-primary bg-pine text-pine-ink" : "text-pine")}>
                {y}
              </span>
            ))}
          </span>
          {["Full test", "Module 1 only", "Module 2 only"].map((p, i) => (
            <span key={p} className={cn("rounded-[10px] border px-3 py-2 text-[14px] font-semibold", i === 0 ? "border-pine-soft" : "border-hairline text-ink-soft")}>
              {p}
            </span>
          ))}
        </div>
      </Tile>
    </div>
  );
}
