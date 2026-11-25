/** A half-circle dial from `min` to `max` with the score filled in pine, like the College Board report. */
export function ScoreGauge({ score, min = 200, max = 800 }: { score: number | null; min?: number; max?: number }) {
  const value = score ?? min;
  const share = Math.min(1, Math.max(0, (value - min) / (max - min)));
  // Arc from the left end (180°) to the right end (0°) of a circle of radius 80 centred at (100, 100).
  const length = Math.PI * 80;
  const angle = Math.PI * (1 - share);
  const dot = { x: 100 + 80 * Math.cos(angle), y: 100 - 80 * Math.sin(angle) };
  return (
    <div className="relative mx-auto w-full max-w-[260px]">
      <svg viewBox="0 0 200 118" className="w-full" aria-hidden="true">
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" className="stroke-hairline" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          className="stroke-pine"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${length * share} ${length}`}
        />
        <circle cx={dot.x} cy={dot.y} r="11" className="fill-paper stroke-pine" strokeWidth="5" />
      </svg>
      <div className="absolute inset-x-0 bottom-3 text-center">
        <p className="text-[44px] font-extrabold leading-none tracking-tight tabular-nums">{score ?? "–"}</p>
      </div>
      <div className="mt-1 flex justify-between px-1 text-[13px] text-graphite tabular-nums">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
