/**
 * The home page hero picture: real pieces of the dashboard, laid over each other like a collage
 * (owner request 27 Nov 2026: show the features, not a question). Sample student, sample numbers,
 * marked as a sample for screen readers.
 */
export function Showcase() {
  return (
    <div role="img" aria-label="A sample student dashboard: profile, bio, ranking, score and a roast" className="relative mx-auto w-full max-w-[600px] lg:h-[470px]">
      {/* Profile, the centerpiece */}
      <div className="fp-float relative z-10 rounded-[22px] border border-hairline bg-paper p-6 font-mono lg:absolute lg:left-0 lg:top-12 lg:w-[400px]">
        <div className="flex items-center gap-4">
          <span className="fp-avatar relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-[22px] font-bold">
            AK
            <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-[3px] border-paper bg-correct" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[24px] leading-tight">Aziza K.</p>
            <p className="mt-1 text-[12px] text-graphite">joined Nov 2026</p>
          </div>
        </div>
        <div className="mt-5 flex items-start justify-between gap-3 rounded-[12px] bg-mist px-4 py-3">
          <p className="text-[14px] leading-snug">Faster than the speed of light.</p>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-pine">
            <path d="M4 20h4L19 9l-4-4L4 16v4z" />
          </svg>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3 tabular-nums">
          {[
            ["64:29", "practicing"],
            ["9,010", "answered"],
            ["1480", "best"],
          ].map(([v, l]) => (
            <div key={l}>
              <dd className="text-[20px] leading-none">{v}</dd>
              <dt className="mt-1.5 text-[11px] text-graphite">{l}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Ranking */}
      <div className="fp-float relative z-20 mt-3 flex items-center gap-4 rounded-[18px] border border-hairline bg-paper px-5 py-4 font-mono lg:absolute lg:right-0 lg:top-0 lg:mt-0">
        <p className="text-[40px] leading-none tracking-[-0.04em]">3rd</p>
        <p className="text-[12px] leading-tight text-graphite">
          all-time
          <br />
          top 8%
        </p>
      </div>

      {/* Score */}
      <div className="fp-float relative z-30 mt-3 rounded-[18px] border border-hairline bg-paper p-5 lg:absolute lg:right-0 lg:top-[300px] lg:mt-0 lg:w-[300px]">
        <div className="flex items-baseline justify-between">
          <p className="text-[44px] font-extrabold leading-none tracking-[-0.04em] tabular-nums">1480</p>
          <p className="text-[13px] font-bold text-correct">+140</p>
        </div>
        <div className="mt-4">
          <div className="relative h-2.5 rounded-full bg-mist ring-1 ring-inset ring-hairline">
            <div className="rp-rainbow-bar absolute inset-y-0 left-0 rounded-full" style={{ width: `${((1480 - 400) / 1200) * 100}%` }} />
            <span className="absolute -top-1.5 h-[22px] w-0.5 -translate-x-1/2 rounded-[1px] bg-graphite/60" style={{ left: `${((1340 - 400) / 1200) * 100}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[12px] text-graphite tabular-nums">
            <span>400</span>
            <span>1600</span>
          </div>
        </div>
      </div>

      {/* Roast */}
      <div className="fp-ink-card fp-float relative z-20 mt-3 rounded-[18px] px-5 py-4 lg:absolute lg:left-6 lg:top-[322px] lg:mt-0 lg:w-[280px]">
        <p className="text-[17px] font-bold leading-snug">It’s not me, it’s your score.</p>
        <p className="mt-3 inline-flex h-8 items-center rounded-full border border-current/25 px-3 text-[12px] font-semibold">Roast me again</p>
      </div>
    </div>
  );
}
