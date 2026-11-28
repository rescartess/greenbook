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
 * The QuantumTest mark: a "Q" ring with a short tail and a small particle in orbit.
 * Its colors follow the design (`--fp-mark-*` in app/globals.css); the Strawberry design shows a
 * strawberry instead, and Winter a wreath (the ring) with a red ribbon (the tail) and a gold star
 * (the particle).
 */
export function LogoMark({ size = 32, variant = "tile", className }: MarkProps) {
  return (
    <>
      <QuantumMark size={size} variant={variant} className={cn("rp-hide wm-hide", className)} />
      <StrawberryMark size={size} variant={variant} className={cn("rp-only", className)} />
      <WreathMark size={size} variant={variant} className={cn("wm-only", className)} />
    </>
  );
}

function QuantumMark({ size = 32, variant = "tile", className }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d={TILE} fill={variant === "tile" ? "var(--fp-mark-bg, #2E46B8)" : "#FFFFFF"} fillOpacity={variant === "tile" ? 1 : 0.18} />
      <g stroke="var(--fp-mark-fg, #FFFFFF)" strokeWidth="24" strokeLinecap="round" fill="none">
        {/* ring */}
        <circle cx="94" cy="96" r="44" />
        {/* tail */}
        <path d="M106 126 Q 128 150 156 144" />
      </g>
      {/* particle */}
      <circle cx="154" cy="50" r="13" fill="var(--fp-mark-dot, #F5C542)" />
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

/** Winter: the Q as a Christmas wreath, its tail a red ribbon, its particle a gold star. */
function WreathMark({ size = 32, variant = "tile", className }: MarkProps) {
  const berries = [[60, 70], [128, 66], [52, 120], [92, 142], [138, 116]];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d={TILE} fill={variant === "tile" ? "#0D2A4A" : "#FFFFFF"} fillOpacity={variant === "tile" ? 1 : 0.18} />
      {/* wreath */}
      <circle cx="94" cy="96" r="44" fill="none" stroke="#1F8A52" strokeWidth="28" />
      <circle cx="94" cy="96" r="44" fill="none" stroke="#3DDC84" strokeWidth="8" strokeDasharray="6 14" strokeLinecap="round" />
      {size > 24
        ? berries.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="#FF4D5E" />)
        : null}
      {/* ribbon tail */}
      <path d="M106 126 Q 128 150 156 144" stroke="#E0243F" strokeWidth="22" strokeLinecap="round" fill="none" />
      {/* star */}
      <path d="M154 26 l 7 15 16 2 -12 11 3 16 -14 -8 -14 8 3 -16 -12 -11 16 -2 Z" fill="#FFD23F" />
    </svg>
  );
}

/** "QuantumTest", colored by the design (see `.fp-word-*` in app/globals.css). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("fp-wordmark font-black tracking-tight", className)}>
      <span className="fp-word-1">Quantum</span>
      <span className="fp-word-2">Test</span>
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
