import { cn } from "./cn";

const TILE =
  "M100 0 C 182 0 200 18 200 100 C 200 182 182 200 100 200 C 18 200 0 182 0 100 C 0 18 18 0 100 0 Z";

type MarkProps = {
  size?: number;
  /** "tile": solid tile (default). "onBrand": translucent tile for colored backgrounds. */
  variant?: "tile" | "onBrand";
  className?: string;
};

/**
 * The FreedomPrep mark: an "F" whose top stroke lifts off like a wing, with a small sun.
 * Its colors follow the design (`--fp-mark-*` in app/globals.css); the Strawberry design shows a
 * strawberry instead.
 */
export function LogoMark({ size = 32, variant = "tile", className }: MarkProps) {
  return (
    <>
      <FreedomMark size={size} variant={variant} className={cn("rp-hide", className)} />
      <StrawberryMark size={size} variant={variant} className={cn("rp-only", className)} />
    </>
  );
}

function FreedomMark({ size = 32, variant = "tile", className }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d={TILE} fill={variant === "tile" ? "var(--fp-mark-bg, #2E46B8)" : "#FFFFFF"} fillOpacity={variant === "tile" ? 1 : 0.18} />
      <g fill="var(--fp-mark-fg, #FFFFFF)">
        {/* stem */}
        <rect x="56" y="62" width="26" height="92" rx="13" />
        {/* top stroke, lifting at the end like a wing */}
        <path d="M69 62 C 69 55 75 49 82 49 L 120 49 C 135 49 146 42 152 32 C 155 27 162 29 161 35 C 158 58 140 75 116 75 L 82 75 C 75 75 69 69 69 62 Z" />
        {/* middle stroke */}
        <rect x="56" y="98" width="68" height="24" rx="12" />
      </g>
      <circle cx="146" cy="128" r="13" fill="var(--fp-mark-dot, #F5C542)" />
    </svg>
  );
}

function StrawberryMark({ size = 32, variant = "tile", className }: MarkProps) {
  const small = size <= 24;
  const seeds = small
    ? [[82, 104], [118, 104], [100, 132], [84, 150], [116, 150]]
    : [[74, 100], [100, 94], [126, 100], [86, 124], [114, 124], [72, 146], [100, 148], [128, 146], [88, 170], [112, 170]];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d={TILE} fill={variant === "tile" ? "#FFE4EC" : "#FFFFFF"} fillOpacity={variant === "tile" ? 1 : 0.2} />
      {/* berry */}
      <path d="M100 66 C 156 56 182 98 166 138 C 152 172 116 192 100 196 C 84 192 48 172 34 138 C 18 98 44 56 100 66 Z" fill="#E11D48" />
      <path d="M62 84 C 72 74 86 70 98 72" stroke="#FF8FAB" strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* seeds */}
      <g fill="#FFE9A8">
        {seeds.map(([x, y]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={small ? 5 : 3.6} ry={small ? 7 : 5.4} />
        ))}
      </g>
      {/* leaves and stem */}
      <path d="M100 74 L 58 50 L 84 56 L 70 24 L 100 46 L 130 24 L 116 56 L 142 50 Z" fill="#2ECC71" stroke="#1F9E55" strokeWidth="4" strokeLinejoin="round" />
      <path d="M100 46 C 100 34 104 24 112 16" stroke="#1F9E55" strokeWidth="8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** "FreedomPrep", colored by the design (see `.fp-word-*` in app/globals.css). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("fp-wordmark font-black tracking-tight", className)}>
      <span className="fp-word-1">Freedom</span>
      <span className="fp-word-2">Prep</span>
    </span>
  );
}

/** Mark + wordmark. */
export function Logo({ size = 30, variant = "tile", className, wordmarkClassName }: MarkProps & { wordmarkClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} variant={variant} />
      <Wordmark className={cn("text-xl", wordmarkClassName)} />
    </span>
  );
}
