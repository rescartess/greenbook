/**
 * The home page backdrop: an SAT answer sheet. Rows of A B C D bubbles, one filled in per row,
 * filling in one after another when the page opens (still, for people who turn motion off).
 * The pattern is fixed, so the server and the browser draw the same thing.
 */
const ROWS = 14;
const GROUPS = 6;

export function BubbleField({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <div className="grid grid-cols-6 gap-x-10 gap-y-3">
        {Array.from({ length: GROUPS * ROWS }, (_, i) => {
          const g = i % GROUPS;
          const r = Math.floor(i / GROUPS);
          const pick = (r * 7 + g * 3 + ((r * g) % 5)) % 4;
          return (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-5 text-right text-[10px] font-semibold tabular-nums text-graphite/60">{r + 1 + g * ROWS}</span>
              {["A", "B", "C", "D"].map((l, j) => (
                <span
                  key={l}
                  className={
                    j === pick
                      ? "fp-bubble-fill h-3.5 w-3.5 rounded-full bg-pine"
                      : "flex h-3.5 w-3.5 items-center justify-center rounded-full border border-graphite/35 text-[7px] font-bold text-graphite/50"
                  }
                  style={j === pick ? { animationDelay: `${(g * ROWS + r) * 35}ms` } : undefined}
                >
                  {j === pick ? null : l}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
