"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Pixels per second the list drifts down on its own. */
const SPEED = 14;
/** How quickly the drift eases in and out (ms to reach about two thirds of the change). */
const EASE_MS = 350;
/** After the student scrolls or touches, wait this long before drifting again. */
const REST_MS = 2500;
/** Pause at the bottom and at the top before turning around. */
const HOLD_MS = 2500;
/** How long the glide back to the top takes. */
const RETURN_MS = 1400;

/**
 * The leaderboard's scroll box (owner requests 27 Nov 2026: scroll by hand, smooth motion, and no
 * wrap-around: first place stays on top, the rest are below it). A real scroll area: wheel,
 * trackpad, touch and keys are the browser's own. When `moving`, it drifts down on its own to the
 * last place, waits, glides back to the top, waits, and starts again. It never loops past the end.
 *
 * Smoothness: one step per screen refresh (60, 120, 144 Hz alike), moved by elapsed time; whole
 * pixels go to scrollTop and the leftover fraction is a GPU transform, so a slow drift glides.
 * The drift never writes while the student scrolls (momentum included). It sleeps off screen,
 * in a hidden tab, and with reduced motion on.
 */
export function RankingScroller({ moving, className, children }: { moving: boolean; className?: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    const list = inner.current;
    if (!el || !list || !moving) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let max = 0;
    let pos = 0;
    let speed = 0;
    let last = 0;
    let frame = 0;
    let restUntil = 0;
    let hover = false;
    let onScreen = true;
    let shift = 0;
    // "down": drifting toward the end; "hold": waiting (holdUntil), then `next`; "back": gliding to the top.
    let phase: "down" | "hold" | "back" = "down";
    let next: "down" | "back" = "back";
    let holdUntil = 0;
    let backFrom = 0;
    let backStart = 0;

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
      max = Math.max(0, el.scrollHeight - el.clientHeight);
      if (pos > max) pos = max;
    };
    const hold = (then: "down" | "back", now: number) => {
      phase = "hold";
      next = then;
      holdUntil = now + HOLD_MS;
      speed = 0;
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      const busy = hover || now < restUntil || el.contains(document.activeElement);

      if (!busy && max > 0) {
        if (phase === "hold" && now >= holdUntil) {
          if (next === "back") {
            phase = "back";
            backFrom = pos;
            backStart = now;
          } else phase = "down";
        }
        if (phase === "down") {
          speed += (SPEED - speed) * (1 - Math.exp(-dt / EASE_MS));
          pos = Math.min(max, pos + (speed * dt) / 1000);
          place();
          if (pos >= max) hold("back", now);
        } else if (phase === "back") {
          const t = Math.min(1, (now - backStart) / RETURN_MS);
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease in and out
          pos = backFrom * (1 - eased);
          place();
          if (t >= 1) hold("down", now);
        }
      } else if (phase === "down") {
        speed = 0;
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
      pos = el.scrollTop;
      // Carry on from where they left it: down from here, or back up if they parked at the end.
      if (pos >= max - 1) hold("back", performance.now());
      else phase = "down";
    };
    const enter = () => (hover = true);
    const leave = () => {
      hover = false;
    };
    const onVisible = () => (document.visibilityState === "visible" ? start() : stop());

    const sizes = new ResizeObserver(measure);
    sizes.observe(list);
    sizes.observe(el);
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      if (onScreen) start();
      else stop();
    });
    seen.observe(el);

    measure();
    hold("down", performance.now()); // a moment at the top first
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
      className={`fp-ticker-end fp-scroll-quiet relative overflow-y-auto overscroll-contain focus:outline-none ${className ?? ""}`}
    >
      <div ref={inner} className="fp-glide">
        {children}
      </div>
    </div>
  );
}
