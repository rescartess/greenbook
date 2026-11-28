import { cn } from "@/core/design/ui";
import { ScoreScale } from "@/core/shell";
import { TestScreenPreview } from "./TestScreenPreview";

/**
 * The home page's product pieces (owner request 28 Nov 2026: the founder's photos came off the home page,
 * the site's features took their place). Everything shown is something the site really does; numbers
 * are a sample student's, marked as a sample for screen readers. Desmos is not shown until its key is set.
 */

/** Hero: the real test screen, tilted, with the score and the adaptive step floating next to it. */
export function HeroStack() {
  return (
    <div role="img" aria-label="The QuantumTest test screen, a sample score of 690 and the adaptive step to a harder Module 2" className="fp-stack relative mx-auto w-full max-w-[760px]">
      <div className="fp-tilt relative">
        <TestScreenPreview />
      </div>

      <div className="fp-float absolute -bottom-[6%] -left-6 z-10 hidden w-[250px] rounded-[18px] border border-hairline bg-paper p-5 sm:block lg:-left-10">
        <p className="text-[12px] font-semibold text-graphite">Reading and Writing</p>
        <p className="mt-1 text-[40px] font-extrabold leading-none tracking-[-0.04em] tabular-nums">690</p>
        <div className="mt-4">
          <ScoreScale value={690} earlier={610} />
        </div>
      </div>

      <div className="fp-float absolute -right-6 top-[-7%] z-10 hidden rounded-[16px] border border-hairline bg-paper px-4 py-3 sm:block">
        <Route />
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
