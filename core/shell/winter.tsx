import type { CSSProperties } from "react";
import { cn } from "@/core/design/ui";
import { Sticker } from "./stickers";

/**
 * Winter design (owner request 28 Nov 2026: Christmas and New Year, balanced): a garland of lights
 * along the top, slow snow, a few stickers in the wide margins (tree, gifts, snowman, deer, Santa,
 * Snegurochka), fireworks and a snowy village on the home page. Everything here carries `wm-only`,
 * so it exists only in the Winter design, and it all stops moving for people who ask for less motion
 * (globals.css). Decoration only: hidden from screen readers.
 */

/** A repeatable "random" number from 0 to 1, the same on the server and in every browser
 *  (an integer hash: exact everywhere, and no two flakes end up moving as a pair). */
function seeded(i: number, salt: number): number {
  let h = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca77);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

const BULB_COLORS = ["#ff4d5e", "#ffd23f", "#3ddc84", "#5cc8ff", "#ff9f1c", "#ff6fd8"];
const SAGS = 14;

/** The string of colored lights hanging along the very top of the page. */
export function Lights({ className }: { className?: string }) {
  const bulbs = Array.from({ length: SAGS * 2 }, (_, i) => {
    const t = (i + 0.5) / 2; // position along the string, in sags
    const along = t % 1; // 0..1 inside one sag
    return { left: `${(t / SAGS) * 100}%`, top: 4 + 10 * 4 * along * (1 - along), color: BULB_COLORS[i % BULB_COLORS.length], delay: `${-seeded(i, 7) * 2.4}s` };
  });
  const wire = Array.from({ length: SAGS }, (_, k) => `M${k * 100} 2 Q ${k * 100 + 50} 26 ${k * 100 + 100} 2`).join(" ");
  return (
    <div aria-hidden="true" className={cn("wm-only pointer-events-none fixed inset-x-0 top-0 z-40 h-7", className)}>
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${SAGS * 100} 28`} preserveAspectRatio="none">
        <path d={wire} fill="none" stroke="var(--wm-wire)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      {bulbs.map((b, i) => (
        <span key={i} className="absolute -translate-x-1/2" style={{ left: b.left, top: b.top }}>
          <span className="block h-[3px] w-[5px] rounded-[1px]" style={{ background: "var(--wm-wire)", margin: "0 auto" }} />
          <span className="wm-bulb block h-[10px] w-[7px] rounded-b-full rounded-t-[3px]" style={{ background: b.color, color: b.color, animationDelay: b.delay }} />
        </span>
      ))}
    </div>
  );
}

/** Slow snow falling behind everything. Fewer flakes on phones. */
export function Snowfall({ count = 28 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="wm-only wm-snowfall pointer-events-none fixed inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const size = 3 + Math.round(seeded(i, 1) * 5);
        const style = {
          left: `${Math.round(seeded(i, 2) * 1000) / 10}%`,
          width: size,
          height: size,
          animationDuration: `${12 + Math.round(seeded(i, 3) * 14)}s, ${3 + Math.round(seeded(i, 4) * 4)}s`,
          animationDelay: `${-Math.round(seeded(i, 5) * 26)}s, ${-Math.round(seeded(i, 6) * 6)}s`,
          opacity: 0.35 + Math.round(seeded(i, 8) * 45) / 100,
        } as CSSProperties;
        return <span key={i} className={cn("wm-flake", i >= 14 && "hidden sm:block")} style={style} />;
      })}
    </div>
  );
}

/** Snegurochka, the Snow Maiden: our own small drawing (blue coat with white fur, a kokoshnik, a long braid). */
export function SnowMaiden({ size = 40, className, style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 80 100" aria-hidden="true" className={cn("rp-sticker", className)} style={{ ["--rp-tilt" as string]: "-4deg", ...style }}>
      {/* braid */}
      <path d="M50 30 C 62 44 58 58 64 72" stroke="#e9b949" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="64" cy="76" r="4" fill="#5cc8ff" />
      {/* coat */}
      <path d="M40 38 L 66 92 Q 40 98 14 92 Z" fill="#3a8ee6" />
      <path d="M14 92 Q 40 98 66 92" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M40 40 L 40 94" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="31" cy="70" r="2" fill="#ffffff" />
      <circle cx="49" cy="62" r="2" fill="#ffffff" />
      {/* face */}
      <circle cx="40" cy="30" r="12" fill="#ffe0cc" />
      <circle cx="34" cy="33" r="2.6" fill="#ff9aa8" opacity="0.8" />
      <circle cx="46" cy="33" r="2.6" fill="#ff9aa8" opacity="0.8" />
      <circle cx="36" cy="29" r="1.3" fill="#2a3550" />
      <circle cx="44" cy="29" r="1.3" fill="#2a3550" />
      {/* kokoshnik */}
      <path d="M24 22 Q 40 -2 56 22 Q 40 16 24 22 Z" fill="#2f6fd0" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M40 7 v 9 M35.5 9.5 l 9 4.5 M44.5 9.5 l -9 4.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type Spot = { emoji?: string; maiden?: boolean; size: number; tilt: number; pos: CSSProperties; wide?: boolean; delay?: string };

/** Where the winter friends stand in the page margins (percent of the window). Few on purpose. */
const SPOTS: Spot[] = [
  { emoji: "🎄", size: 34, tilt: -6, pos: { top: "12%", right: "2.4%" } },
  { emoji: "🎁", size: 26, tilt: 10, pos: { top: "40%", right: "1.6%" }, wide: true, delay: "-1.5s" },
  { maiden: true, size: 34, tilt: 0, pos: { bottom: "10%", right: "2.6%" }, delay: "-3s" },
  { emoji: "⛄", size: 30, tilt: -8, pos: { top: "66%", right: "4.2%" }, wide: true, delay: "-2.2s" },
  { emoji: "🦌", size: 28, tilt: 6, pos: { bottom: "14%", left: "1.8%" }, wide: true, delay: "-0.8s" },
  { emoji: "🎅", size: 28, tilt: -10, pos: { top: "24%", left: "1.6%" }, wide: true, delay: "-2.6s" },
];

/** The winter friends floating in the margins, behind the cards (like Strawberry's Sprinkles). */
export function WinterSpots({ roomy = false }: { roomy?: boolean }) {
  const show = (wide?: boolean) => (roomy ? (wide ? "hidden nav:block" : "hidden sm:block") : "hidden min-[1560px]:block");
  return (
    <div aria-hidden="true" className="wm-only pointer-events-none fixed inset-0 overflow-hidden">
      {SPOTS.map((s, i) => (
        <span key={i} className={cn("absolute", show(s.wide))} style={s.pos}>
          {s.maiden ? (
            <SnowMaiden size={s.size} className="rp-bob" style={{ animationDelay: s.delay }} />
          ) : (
            <Sticker design="winter" emoji={s.emoji ?? "❄️"} size={s.size} tilt={s.tilt} bob style={{ animationDelay: s.delay }} />
          )}
        </span>
      ))}
    </div>
  );
}

/** Everything a Winter page frame needs: lights on top, snow behind, friends in the margins. */
export function WinterScene({ roomy = false }: { roomy?: boolean }) {
  return (
    <>
      <Snowfall />
      <WinterSpots roomy={roomy} />
      <Lights />
    </>
  );
}

const BURSTS = [
  { left: "12%", top: "16%", size: 120, color: "#ffd23f", delay: "0s" },
  { left: "44%", top: "8%", size: 90, color: "#ff5f7a", delay: "-1.7s" },
  { left: "82%", top: "20%", size: 140, color: "#7fd8ff", delay: "-3.1s" },
  { left: "66%", top: "48%", size: 80, color: "#b6f36b", delay: "-0.9s" },
];

/** New Year fireworks: soft bursts that bloom and fade, behind the home page's first screen. */
export function Fireworks({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("wm-only wm-fireworks pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {BURSTS.map((b, i) => (
        <span key={i} className="wm-burst absolute" style={{ left: b.left, top: b.top, width: b.size, height: b.size, color: b.color, animationDelay: b.delay }}>
          {Array.from({ length: 12 }, (_, k) => (
            <span key={k} className="wm-ray" style={{ transform: `rotate(${k * 30}deg)` }} />
          ))}
        </span>
      ))}
    </div>
  );
}

/** A row of snowy houses with warm windows, a lit tree and lights strung between the roofs. */
export function Village({ className }: { className?: string }) {
  // Ten houses of different sizes, with a gap in the middle for the town tree.
  const houses = [40, 170, 280, 420, 530, 820, 930, 1060, 1170, 1290].map((x, i) => ({
    x,
    w: 70 + Math.round(seeded(i, 11) * 40),
    h: 52 + Math.round(seeded(i, 12) * 32),
    roof: 26 + Math.round(seeded(i, 13) * 14),
  }));
  const ground = 150;
  return (
    <svg aria-hidden="true" viewBox="0 0 1400 160" preserveAspectRatio="xMidYMax meet" className={cn("wm-only block w-full", className)}>
      {/* snow ground */}
      <path d={`M0 ${ground} Q 350 ${ground - 12} 700 ${ground - 2} T 1400 ${ground - 6} V 160 H 0 Z`} fill="#ffffff" opacity="0.9" />
      {houses.map((h, i) => {
        const top = ground - h.h;
        return (
          <g key={i}>
            <rect x={h.x} y={top} width={h.w} height={h.h} fill="#22345a" />
            {/* roof with snow */}
            <path d={`M${h.x - 8} ${top + 2} L ${h.x + h.w / 2} ${top - h.roof} L ${h.x + h.w + 8} ${top + 2} Z`} fill="#c93a4c" />
            <path d={`M${h.x - 10} ${top + 2} L ${h.x + h.w / 2} ${top - h.roof - 4} L ${h.x + h.w + 10} ${top + 2}`} fill="none" stroke="#ffffff" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
            {/* windows */}
            <rect x={h.x + h.w * 0.18} y={top + h.h * 0.22} width={h.w * 0.22} height={h.h * 0.24} rx="2" fill="#ffd36b" className="wm-window" style={{ animationDelay: `${-i * 0.9}s` }} />
            <rect x={h.x + h.w * 0.6} y={top + h.h * 0.22} width={h.w * 0.22} height={h.h * 0.24} rx="2" fill="#ffd36b" />
            {/* door */}
            <rect x={h.x + h.w * 0.42} y={ground - h.h * 0.42} width={h.w * 0.16} height={h.h * 0.42} rx="2" fill="#7a4a2c" />
            {/* lights along the roof edge */}
            {[0.15, 0.35, 0.65, 0.85].map((f, k) => (
              <circle key={k} cx={h.x - 8 + (h.w + 16) * f} cy={top + 1 - (f < 0.5 ? f : 1 - f) * 2 * h.roof} r="3.2" fill={BULB_COLORS[(i + k) % BULB_COLORS.length]} className="wm-bulb" style={{ animationDelay: `${-(i + k) * 0.37}s` }} />
            ))}
          </g>
        );
      })}
      {/* the town tree */}
      <g>
        <path d={`M700 ${ground - 104} L 736 ${ground - 52} H 718 L 746 ${ground - 18} H 654 L 682 ${ground - 52} H 664 Z`} fill="#1f8a52" />
        <rect x="694" y={ground - 18} width="12" height="14" fill="#7a4a2c" />
        <path d="M700 34 l 4 9 10 1 -8 6 3 10 -9 -6 -9 6 3 -10 -8 -6 10 -1 Z" fill="#ffd23f" className="wm-star" />
        {[[688, 80], [712, 86], [680, 108], [720, 112], [700, 98], [672, 124], [728, 126]].map(([x, y], k) => (
          <circle key={k} cx={x} cy={y} r="3.4" fill={BULB_COLORS[k % BULB_COLORS.length]} className="wm-bulb" style={{ animationDelay: `${-k * 0.41}s` }} />
        ))}
      </g>
    </svg>
  );
}
