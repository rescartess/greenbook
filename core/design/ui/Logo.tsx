import { useId } from "react";
import { cn } from "./cn";

const TILE =
  "M100 0 C 182 0 200 18 200 100 C 200 182 182 200 100 200 C 18 200 0 182 0 100 C 0 18 18 0 100 0 Z";

/** The rainbow bands, outside in (Rainbow design). Fixed brand colors. */
const BANDS = ["#FF4D6D", "#FF9F1C", "#FFD60A", "#2ECC71", "#3A86FF", "#8B5CF6"];

type MarkProps = {
  size?: number;
  /** "tile": solid tile (default). "onBrand": translucent tile for colored backgrounds. */
  variant?: "tile" | "onBrand";
  className?: string;
};

/**
 * The FreedomPrep mark: an "F" whose top stroke lifts off like a wing, with a small sun.
 * Its colors follow the design (`--fp-mark-*` in app/globals.css); the Rainbow design shows the
 * rainbow-and-strawberry mark instead.
 */
export function LogoMark({ size = 32, variant = "tile", className }: MarkProps) {
  return (
    <>
      <FreedomMark size={size} variant={variant} className={cn("rp-hide", className)} />
      <RainbowMark size={size} variant={variant} className={cn("rp-only", className)} />
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

function RainbowMark({ size = 32, variant = "tile", className }: MarkProps) {
  const id = useId().replace(/:/g, "");
  const small = size <= 24;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" className={cn("shrink-0", className)}>
      <defs>
        <clipPath id={`${id}-tile`}>
          <path d={TILE} />
        </clipPath>
      </defs>
      <path d={TILE} fill={variant === "tile" ? "#FFF1F5" : "#FFFFFF"} fillOpacity={variant === "tile" ? 1 : 0.2} />
      <g clipPath={`url(#${id}-tile)`} fill="none" strokeWidth={small ? 15 : 13}>
        {BANDS.map((c, i) => {
          const r = 82 - i * (small ? 14 : 12.5);
          return <path key={c} d={`M${100 - r} 148 A ${r} ${r} 0 0 1 ${100 + r} 148`} stroke={c} />;
        })}
      </g>
      <g fill="#FFFFFF" stroke="#F3C4D3" strokeWidth="4">
        <path d="M14 162 a16 16 0 0 1 22-20 a20 20 0 0 1 36 6 a14 14 0 0 1 2 28 h-50 a14 14 0 0 1 -10-14 z" />
        <path d="M126 162 a16 16 0 0 1 22-20 a20 20 0 0 1 36 6 a14 14 0 0 1 2 28 h-50 a14 14 0 0 1 -10-14 z" />
      </g>
      {small ? null : (
        <g transform="translate(150 14) rotate(14)">
          <path d="M18 14 C 34 10 44 22 40 38 C 36 54 24 62 18 64 C 12 62 0 54 -4 38 C -8 22 2 10 18 14 Z" fill="#FF2D55" stroke="#FFFFFF" strokeWidth="5" />
          <path d="M18 16 L 6 6 L 14 12 L 10 0 L 18 10 L 26 0 L 22 12 L 30 6 Z" fill="#2ECC71" stroke="#1F9E55" strokeWidth="2" strokeLinejoin="round" />
          <g fill="#FFE9A8">
            <circle cx="10" cy="30" r="2.4" />
            <circle cx="24" cy="28" r="2.4" />
            <circle cx="17" cy="42" r="2.4" />
            <circle cx="30" cy="40" r="2.4" />
            <circle cx="8" cy="44" r="2.4" />
          </g>
        </g>
      )}
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
