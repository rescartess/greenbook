"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Pixels per second the list drifts up on its own. */
const SPEED = 14;
/** After the student scrolls or touches, wait this long before drifting again. */
const REST_MS = 2500;

/**
 * The leaderboard's scroll box (owner request 27 Nov 2026: it must scroll by hand too).
 * A real scroll area: wheel, touch and keys work. When `moving`, the children hold the list
 * twice, the box drifts up slowly and wraps at the halfway point, so it never ends either way.
 * It pauses under the pointer, while focused, and for a moment after the student scrolls.
 */
export function RankingScroller({ moving, children }: { moving: boolean; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || !moving) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Keep the position inside [1, half + 1): one pixel of room above lets a scroll up wrap too.
    el.scrollTop = 1;
    let pos = el.scrollTop;
    let last = performance.now();
    let restUntil = 0;
    let hover = false;
    let frame = 0;
    let selfScroll = false;

    const half = () => el.scrollHeight / 2;
    const wrap = () => {
      const h = half();
      if (h <= 0) return;
      if (el.scrollTop >= h + 1) el.scrollTop -= h;
      else if (el.scrollTop < 1) el.scrollTop += h;
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      const busy = hover || now < restUntil || el.contains(document.activeElement);
      if (!still && !busy) {
        pos += (SPEED * dt) / 1000;
        if (pos >= half() + 1) pos -= half();
        selfScroll = true;
        el.scrollTop = pos;
      }
      frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (selfScroll) {
        selfScroll = false;
        return;
      }
      wrap();
      pos = el.scrollTop;
    };
    const rest = () => {
      restUntil = performance.now() + REST_MS;
    };
    const enter = () => (hover = true);
    const leave = () => {
      hover = false;
      rest();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", rest, { passive: true });
    el.addEventListener("touchstart", rest, { passive: true });
    el.addEventListener("touchmove", rest, { passive: true });
    el.addEventListener("keydown", rest);
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", rest);
      el.removeEventListener("touchstart", rest);
      el.removeEventListener("touchmove", rest);
      el.removeEventListener("keydown", rest);
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, [moving]);

  return (
    <div
      ref={box}
      tabIndex={0}
      aria-label="Leaderboard, scrollable"
      className="fp-ticker fp-scroll-quiet relative h-[232px] overflow-y-auto overscroll-contain focus:outline-none"
    >
      {children}
    </div>
  );
}
