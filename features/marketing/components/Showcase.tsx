/**
 * "Make it yours." on the home page: the profile pieces a student sets, laid over each other like a
 * collage: photo, bio (being edited), all-time rank, design and colors, and a roast. Since 28 Nov 2026
 * the hero shows the stats and the leaderboard, so this part shows what students change.
 */
export function Showcase() {
  return (
    <div role="img" aria-label="A sample student profile: photo, bio being edited, all-time rank, design and colors, and a roast" className="relative mx-auto w-full max-w-[600px] lg:h-[470px]">
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
        <div className="mt-4 flex items-center gap-2 text-[12px] text-graphite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          Change photo
        </div>
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

      {/* Design and colors */}
      <div className="fp-float relative z-30 mt-3 rounded-[18px] border border-hairline bg-paper p-5 lg:absolute lg:right-0 lg:top-[300px] lg:mt-0 lg:w-[300px]">
        <p className="text-[13px] font-semibold text-graphite">Design</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["Default", "Strawberry", "Premium", "Nerd", "Winter"].map((d, i) => (
            <span key={d} className={`rounded-full px-3 py-1 text-[13px] font-semibold ${i === 0 ? "rp-btn-primary bg-pine text-pine-ink" : "border border-hairline text-ink-soft"}`}>
              {d}
            </span>
          ))}
        </div>
        <p className="mt-4 text-[13px] font-semibold text-graphite">Colors</p>
        <div className="mt-2 flex items-center gap-2">
          {["bg-pine", "bg-pine-soft", "bg-correct", "bg-incorrect", "bg-ink"].map((c) => (
            <span key={c} className={`h-6 w-6 rounded-full ring-2 ring-paper ${c}`} />
          ))}
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
