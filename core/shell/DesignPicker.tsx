"use client";

import { DESIGNS, useDesign, type Design } from "@/core/design/theme";
import { cn } from "@/core/design/ui";

/** How each design looks, drawn small. Fixed sample colors (light mode), not theme tokens. */
const LOOK: Record<Design, { name: string; text: string; canvas: string; card: string; line: string; accent: string; extra?: "berry" | "gold" | "grid" }> = {
  default: { name: "Default", text: "Bluebook white and blue", canvas: "#f4f6fa", card: "#ffffff", line: "#e1e5ec", accent: "#2e46b8" },
  strawberry: { name: "Strawberry", text: "Pink, sweet, full of stickers", canvas: "#fff4f8", card: "#ffffff", line: "#f6dbe6", accent: "#d6246e", extra: "berry" },
  premium: { name: "Premium", text: "Sand, bronze and espresso", canvas: "#e6d6c5", card: "#f8f1e9", line: "#dcc9b5", accent: "#1d1510", extra: "gold" },
  study: { name: "Study", text: "Cream paper and green", canvas: "#f6f3ea", card: "#ffffff", line: "#e6e0d2", accent: "#157a3c", extra: "grid" },
};

function Thumb({ d }: { d: Design }) {
  const l = LOOK[d];
  return (
    <span aria-hidden="true" className="relative block h-[74px] overflow-hidden rounded-[8px] border" style={{ background: l.canvas, borderColor: l.line }}>
      {l.extra === "grid" ? (
        <span
          className="absolute inset-0"
          style={{ backgroundImage: `linear-gradient(${l.line} 1px, transparent 1px), linear-gradient(90deg, ${l.line} 1px, transparent 1px)`, backgroundSize: "10px 10px" }}
        />
      ) : null}
      <span className="absolute inset-x-3 top-3 bottom-0 overflow-hidden rounded-t-[6px] border border-b-0" style={{ background: l.card, borderColor: l.line }}>
        {l.extra === "berry" ? (
          <span className="absolute inset-x-2 top-0 h-[3px] rounded-b" style={{ background: "linear-gradient(90deg,#e11d48,#ff4d6d,#ff8fab,#ff4d6d,#e11d48)" }} />
        ) : null}
        {l.extra === "gold" ? (
          <span className="absolute inset-x-3 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,#9a6b3a,transparent)" }} />
        ) : null}
        {l.extra === "grid" ? <span className="absolute -right-3 -top-3 h-9 w-9 rounded-full" style={{ background: "#f9e4bd" }} /> : null}
        <span className="absolute left-2.5 top-3 h-1.5 w-12 rounded-full" style={{ background: l.accent, opacity: 0.85 }} />
        <span className="absolute left-2.5 top-6 h-1 w-20 rounded-full" style={{ background: l.line }} />
        <span
          className="absolute bottom-2 left-2.5 h-3.5 w-10"
          style={{ background: l.accent, borderRadius: d === "default" || d === "premium" ? 999 : 4 }}
        />
        {d === "strawberry" ? <span className="absolute bottom-1 right-2 text-[14px] leading-none">🍓</span> : null}
      </span>
    </span>
  );
}

/**
 * Pick one of the FreedomPrep designs. It changes every page except the test and practice screens,
 * right away, and is remembered on this device.
 */
export function DesignPicker({ className, variant = "tiles" }: { className?: string; variant?: "tiles" | "chips" }) {
  const { design, setDesign } = useDesign();
  if (variant === "chips") {
    // Small buttons that switch at once, for a row of other buttons (owner request 27 Nov 2026).
    return (
      <div role="radiogroup" aria-label="Design" className={cn("flex flex-wrap items-center gap-1.5", className)}>
        {DESIGNS.map((d) => {
          const on = d === design;
          const l = LOOK[d];
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setDesign(d)}
              className={cn(
                "fp-label inline-flex h-10 items-center gap-2 rounded-[var(--fp-r-btn)] border pl-2 pr-3.5 text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine",
                on ? "border-pine bg-pine-tint text-ink" : "border-hairline bg-paper text-ink-soft hover:border-graphite/40 hover:text-ink",
              )}
            >
              <span aria-hidden="true" className="h-5 w-5 rounded-full border" style={{ background: `linear-gradient(135deg, ${l.canvas} 50%, ${l.accent} 50%)`, borderColor: l.line }} />
              {l.name}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <fieldset className={className}>
      <legend className="text-[15px] font-bold">Design</legend>
      <p className="text-[13px] text-graphite">Changes every page except the test and practice screens. Saved on this device</p>
      <div role="radiogroup" aria-label="Design" className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {DESIGNS.map((d) => {
          const on = d === design;
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setDesign(d)}
              className={cn(
                "rounded-[12px] border bg-paper p-2 text-left text-ink transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine",
                on ? "border-pine ring-2 ring-pine" : "border-hairline hover:border-graphite/40",
              )}
            >
              <Thumb d={d} />
              <span className="mt-2 block px-1 text-[14px] font-bold">{LOOK[d].name}</span>
              <span className="block px-1 pb-0.5 text-[12px] text-graphite">{LOOK[d].text}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
