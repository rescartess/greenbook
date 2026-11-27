/**
 * The moment of the redesign: a score placed on the 200–800 section scale (or 400–1600 total).
 * A rainbow fill up to the score, a dark marker at the score, and an optional grey marker for an earlier one.
 */
export function ScoreScale({
  value,
  earlier,
  min = 200,
  max = 800,
}: {
  value: number;
  earlier?: number | null;
  min?: number;
  max?: number;
}) {
  const at = (n: number) => `${(Math.min(max, Math.max(min, n)) - min) / (max - min) * 100}%`;
  const ticks = Array.from({ length: (max - min) / 100 + 1 }, (_, i) => min + i * 100);
  return (
    <div role="img" aria-label={`${value} on a scale from ${min} to ${max}${earlier != null ? `, earlier ${earlier}` : ""}`}>
      <div className="relative h-2.5 rounded-[5px] bg-mist ring-1 ring-hairline ring-inset">
        <div className="rp-rainbow-bar absolute inset-y-0 left-0 rounded-[5px]" style={{ width: at(value) }} />
        {earlier != null ? (
          <span className="absolute -top-1.5 h-[22px] w-0.5 -translate-x-1/2 rounded-[1px] bg-graphite/70" style={{ left: at(earlier) }} />
        ) : null}
        <span className="absolute -top-1.5 h-[22px] w-0.5 -translate-x-1/2 rounded-[1px] bg-ink" style={{ left: at(value) }} />
      </div>
      <div className="mt-2.5 flex justify-between text-[12px] text-graphite tabular-nums">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}
