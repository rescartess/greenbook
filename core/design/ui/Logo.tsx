import { useId } from "react";
import { cn } from "./cn";

const TILE =
  "M100 0 C 182 0 200 18 200 100 C 200 182 182 200 100 200 C 18 200 0 182 0 100 C 0 18 18 0 100 0 Z";

/** The six rainbow bands, outside in. Fixed brand colors, not theme tokens. */
const BANDS = ["#FF4D6D", "#FF9F1C", "#FFD60A", "#2ECC71", "#3A86FF", "#8B5CF6"];

type MarkProps = {
  size?: number;
  /** "tile": cream tile (default). "onBrand": translucent tile for colored backgrounds. */
  variant?: "tile" | "onBrand";
  className?: string;
};

/** The RainbowPrep mark: a rainbow over two clouds, with a strawberry sticker in the corner. */
export function LogoMark({ size = 32, variant = "tile", className }: MarkProps) {
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
      {/* clouds */}
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

type LogoProps = MarkProps & { wordmarkClassName?: string };

/** Mark + "RainbowPrep" wordmark ("Rainbow" in rainbow letters). */
export function Logo({ size = 30, variant = "tile", className, wordmarkClassName }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} variant={variant} />
      <span className={cn("text-xl font-black tracking-tight", wordmarkClassName)}>
        <span className="rp-rainbow-text">Rainbow</span>Prep
      </span>
    </span>
  );
}
