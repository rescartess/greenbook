import type { CSSProperties } from "react";
import { cn } from "@/core/design/ui";

/**
 * Strawberry-design stickers (owner request, 27 Nov 2026; shown only in the Strawberry design): emoji with a white die-cut edge,
 * a soft shadow and a small tilt. They wiggle when hovered. Decoration only: hidden from screen readers.
 */
export function Sticker({
  emoji,
  size = 24,
  tilt = -8,
  bob = false,
  className,
  style,
}: {
  emoji: string;
  size?: number;
  tilt?: number;
  /** Float gently up and down. */
  bob?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("rp-sticker rp-only select-none", bob && "rp-bob", className)}
      style={{ fontSize: size, ["--rp-tilt" as string]: `${tilt}deg`, ...style }}
    >
      {emoji}
    </span>
  );
}

/** The thin strawberry-pink stripe along the very top of the page (Strawberry design). */
export function BerryStripe({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("rp-rainbow-bar rp-only pointer-events-none fixed inset-x-0 top-0 z-40 h-1.5", className)} />;
}

type Spot = { emoji: string; size: number; tilt: number; pos: CSSProperties; wide?: boolean; delay?: string };

/** Where the strawberries and friends sit around the page edges (percent of the window). */
const SPOTS: Spot[] = [
  { emoji: "🍓", size: 30, tilt: -14, pos: { top: "9%", right: "2.5%" } },
  { emoji: "🌸", size: 30, tilt: 8, pos: { top: "42%", right: "1.4%" }, wide: true, delay: "-1.5s" },
  { emoji: "🍓", size: 24, tilt: 18, pos: { bottom: "12%", right: "3%" }, delay: "-3s" },
  { emoji: "✨", size: 22, tilt: 0, pos: { top: "26%", right: "4.5%" }, wide: true, delay: "-2s" },
  { emoji: "🍓", size: 26, tilt: 10, pos: { bottom: "6%", left: "46%" }, wide: true, delay: "-0.8s" },
  { emoji: "🍰", size: 28, tilt: -6, pos: { top: "70%", right: "4%" }, wide: true, delay: "-2.6s" },
];

/**
 * Strawberries, blossoms and sparkles floating in the page margins, behind the cards.
 * Put it first inside a positioned page wrapper; content after it paints on top.
 */
export function Sprinkles({ roomy = false }: { roomy?: boolean }) {
  // `roomy` pages (home, login) have wide margins; inside the app shell the cards reach the edge,
  // so the sprinkles only show on very wide screens there.
  const show = (wide?: boolean) => (roomy ? (wide ? "hidden nav:block" : "hidden sm:block") : "hidden min-[1560px]:block");
  return (
    <div aria-hidden="true" className="rp-only pointer-events-none fixed inset-0 overflow-hidden">
      {SPOTS.map((s, i) => (
        <span key={i} className={cn("absolute", show(s.wide))} style={s.pos}>
          <Sticker emoji={s.emoji} size={s.size} tilt={s.tilt} bob style={{ animationDelay: s.delay }} />
        </span>
      ))}
    </div>
  );
}

/** Pick a sticker for a page title from its words. */
export function titleEmoji(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("dashboard")) return "🍓";
  if (t.includes("full test") || t.includes("test")) return "📝";
  if (t.includes("topic")) return "📚";
  if (t.includes("result") || t.includes("score")) return "🏆";
  if (t.includes("mistake")) return "🧺";
  if (t.includes("profile")) return "🦄";
  if (t.includes("month")) return "📅";
  if (t.includes("admin") || t.includes("question") || t.includes("import")) return "🛠️";
  return "✨";
}
