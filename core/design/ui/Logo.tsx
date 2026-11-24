import { useId } from "react";
import { cn } from "./cn";

const STAR =
  "M100 38 L115.3 85 L164.7 85 L124.7 114 L140 161 L100 132 L60 161 L75.3 114 L35.3 85 L84.7 85 Z";
const TILE =
  "M100 0 C 182 0 200 18 200 100 C 200 182 182 200 100 200 C 18 200 0 182 0 100 C 0 18 18 0 100 0 Z";

type MarkProps = {
  size?: number;
  /** "tile": green tile (default). "onBrand": translucent tile for the green hero. */
  variant?: "tile" | "onBrand";
  className?: string;
};

/** The GreenBook "Slice" star. Colors are fixed brand colors, not theme tokens. */
export function LogoMark({ size = 32, variant = "tile", className }: MarkProps) {
  const id = useId().replace(/:/g, "");
  // The cut is too fine to see at tiny sizes, so the top piece lifts more as the mark shrinks.
  const lift = size <= 24 ? "translate(3 -8)" : size <= 48 ? "translate(2 -6)" : "translate(1.5 -4.5)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <defs>
        <clipPath id={`${id}-up`}>
          <path d="M0 0 L200 0 L200 48.75 L0 161.25 Z" />
        </clipPath>
        <clipPath id={`${id}-down`}>
          <path d="M0 161.25 L200 48.75 L200 200 L0 200 Z" />
        </clipPath>
      </defs>
      <path d={TILE} fill={variant === "tile" ? "#2D5652" : "#FFFFFF"} fillOpacity={variant === "tile" ? 1 : 0.16} />
      <g clipPath={`url(#${id}-up)`}>
        <path transform={lift} d={STAR} fill="#FFFFFF" />
      </g>
      <g clipPath={`url(#${id}-down)`}>
        <path d={STAR} fill="#8DB9AD" />
      </g>
    </svg>
  );
}

type LogoProps = MarkProps & { wordmarkClassName?: string };

/** Mark + "GreenBook" wordmark. */
export function Logo({ size = 30, variant = "tile", className, wordmarkClassName }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} variant={variant} />
      <span className={cn("text-xl font-extrabold tracking-tight", wordmarkClassName)}>GreenBook</span>
    </span>
  );
}
