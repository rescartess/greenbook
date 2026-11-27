"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Pixels per second the list drifts up on its own. */
const SPEED = 14;
/** How quickly the drift eases in and out (ms to reach about two thirds of the change). */
const EASE_MS = 350;
/** After the student scrolls or touches, wait this long before drifting again. */
const REST_MS = 2500;

/**
 * The leaderboard's scroll box (owner requests 27 Nov 2026: scroll by hand, and smooth motion).
 * A real scroll area: wheel, trackpad, touch and keys are the browser's own, so they stay smooth.
 * When `moving`, the children hold the list twice and the box drifts up on its own, wrapping at
 * the halfway point so it never ends either way.
 *
 * Smoothness: the loop runs once per screen refresh (60, 120, 144 Hz alike) and moves by elapsed
 * time, not by frames. Whole pixels go to scrollTop; the leftover fraction is a GPU transform on
 * the list, so a slow drift glides instead of stepping one pixel at a time. Speed eases in and
 * out. The drift never writes while the student scrolls (momentum included), so it can't fight
 * them. Layout is measured only when the list's size changes, never per frame. The loop sleeps
 * when the box is off screen, the tab is hidden, or reduced motion is on.
 */
export function RankingScroller({ moving, children }: { moving: boolean; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    const list = inner.current;
    if (!el || !list || !moving) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let half = 0;
    let pos = 1; // kept inside [1, half + 1): one pixel of room above lets a scroll up wrap too
    let speed = 0;
    let last = 0;
    let frame = 0;
    let restUntil = 0;
    let hover = false;
    let onScreen = true;
    let shift = 0;

    const setShift = (px: number) => {
      if (px === shift) return;
      shift = px;
      list.style.transform = px ? `translate3d(0, ${-px}px, 0)` : "";
    };
    const place = () => {
      const whole = Math.floor(pos);
      if (el.scrollTop !== whole) el.scrollTop = whole;
      setShift(Math.round((pos - whole) * 100) / 100);
    };
    const measure = () => {
      half = el.scrollHeight / 2;
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      const busy = hover || now < restUntil || el.contains(document.activeElement);
      const target = busy ? 0 : SPEED;
      speed += (target - speed) * (1 - Math.exp(-dt / EASE_MS));
      if (speed > 0.05 && half > 0) {
        pos += (speed * dt) / 1000;
        if (pos >= half + 1) pos -= half;
        place();
      }
      start();
    };
    const start = () => {
      if (!frame && onScreen && document.visibilityState === "visible") frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    };

    const rest = () => {
      restUntil = performance.now() + REST_MS;
      speed = 0;
    };
    const onScroll = () => {
      // Our own writes land on Math.floor(pos); anything else is the student (or their momentum).
      if (el.scrollTop === Math.floor(pos)) return;
      rest();
      setShift(0);
      if (half > 0) {
        if (el.scrollTop >= half + 1) el.scrollTop -= half;
        else if (el.scrollTop < 1) el.scrollTop += half;
      }
      pos = el.scrollTop;
    };
    const enter = () => (hover = true);
    const leave = () => {
      hover = false;
    };
    const onVisible = () => (document.visibilityState === "visible" ? start() : stop());

    const sizes = new ResizeObserver(measure);
    sizes.observe(list);
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      if (onScreen) start();
      else stop();
    });
    seen.observe(el);

    measure();
    place();
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", rest, { passive: true });
    el.addEventListener("touchstart", rest, { passive: true });
    el.addEventListener("keydown", rest);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", onVisible);
    start();

    return () => {
      stop();
      sizes.disconnect();
      seen.disconnect();
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", rest);
      el.removeEventListener("touchstart", rest);
      el.removeEventListener("keydown", rest);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", onVisible);
      list.style.transform = "";
    };
  }, [moving]);

  return (
    <div
      ref={box}
      tabIndex={0}
      aria-label="Leaderboard, scrollable"
      className="fp-ticker fp-scroll-quiet relative h-[232px] overflow-y-auto overscroll-contain focus:outline-none"
    >
      <div ref={inner} className="fp-glide">
        {children}
      </div>
    </div>
  );
}
