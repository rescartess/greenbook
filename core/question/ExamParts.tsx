"use client";

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useTheme } from "@/core/design/theme";
import type { ActiveHighlight } from "./exam-hooks";
import { HIGHLIGHT_COLORS, type HighlightColor } from "./highlights";
import { cn } from "@/core/design/ui";
import type { DirectionExample } from "@/core/config/subjects";
import { RichLine, RichText } from "./RichText";

/*
 * The pieces of the Bluebook-style exam screen, shared by the timed test and by practice.
 * Flat full-width bars in pine tint with dashed rules (owner request), no glass.
 */

/** Top bar: title and directions on the left, clock in the middle, tools on the right. */
export function ExamTopBar({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center?: ReactNode;
  right: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-pine-tint font-sans">
      <div className="mx-auto grid min-h-[84px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:gap-3 sm:px-8">
        <div className="relative min-w-0">{left}</div>
        <div className="flex flex-col items-center gap-1" aria-live="polite">
          {center}
        </div>
        <div className="flex items-center justify-end gap-0 sm:gap-2">
          {right}
        </div>
      </div>
      <div className="border-b-[3px] border-dashed border-ink/70" />
    </header>
  );
}

/** Bottom bar: name on the left, question map button in the middle, Back/Next on the right. */
export function ExamBottomBar({
  left,
  center,
  right,
}: {
  left?: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  return (
    <footer className="fixed bottom-0 left-[var(--exam-left,0px)] right-0 z-30 bg-pine-tint font-sans">
      <div className="border-t-[3px] border-dashed border-ink/70" />
      <div className="mx-auto grid h-[76px] max-w-[1600px] grid-cols-[auto_1fr] items-center gap-2 px-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:px-8">
        <span className="hidden min-w-0 truncate text-[19px] font-medium sm:block">
          {left}
        </span>
        <div className="sm:col-start-2">{center}</div>
        <div className="flex justify-end gap-1.5 sm:gap-2 [&>button]:max-sm:px-3.5">
          {right}
        </div>
      </div>
    </footer>
  );
}

/** Title line plus a "Directions" popover, for the left of the top bar. */
export function ExamTitle({
  title,
  directions,
  examples,
}: {
  title: ReactNode;
  /** Blocks in the question text format (bold, "- " bullets, math). */
  directions?: readonly string[];
  /** Typed-answer examples drawn as a table under the text (Math). */
  examples?: readonly DirectionExample[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p className="truncate text-[16px] font-medium sm:text-[21px]">{title}</p>
      {directions?.length ? (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="mt-1 flex items-center gap-1.5 text-[16px] font-medium hover:underline"
          >
            Directions
            <Chevron
              className={cn("transition-transform", open && "rotate-180")}
            />
          </button>
          {open ? (
            <>
              {/* Dims the page between the bars; a click outside closes the directions. */}
              <div aria-hidden="true" onClick={() => setOpen(false)} className="fixed bottom-[79px] left-[var(--exam-left,0px)] right-0 top-[87px] z-30 bg-ink/20" />
              {/* Like Bluebook: a wide card under the button with a small pointer, the text scrolls and Close stays put. */}
              <div
                role="dialog"
                aria-label="Directions"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                }}
                className="fixed left-[calc(var(--exam-left,0px)+12px)] top-[95px] z-40 flex max-h-[calc(100dvh-87px-79px-16px)] w-[min(900px,calc(100vw-var(--exam-left,0px)-24px))] flex-col rounded-[10px] border border-control bg-paper font-serif text-ink shadow-[0_8px_30px_rgb(0_0_0/0.18)] sm:left-[calc(var(--exam-left,0px)+24px)]"
              >
                <span
                  aria-hidden="true"
                  className="absolute -top-[9px] left-10 h-4 w-4 rotate-45 border-l border-t border-control bg-paper"
                />
                <div className="gb-scroll-visible min-h-0 flex-1 overflow-y-auto px-5 pt-6 sm:px-8">
                  <div className="space-y-3 text-[16px] leading-[1.65] sm:text-[17px] [&_ul]:space-y-0.5 [&_ul]:pl-10 sm:[&_ul]:pl-14 [&_li]:marker:text-ink">
                    {directions.map((d) => (
                      <RichText key={d} source={d} className="space-y-3" />
                    ))}
                  </div>
                  {examples?.length ? <DirectionExamples rows={examples} /> : null}
                  <div className="h-5" />
                </div>
                <div className="flex shrink-0 justify-end px-5 pb-5 pt-3 font-sans sm:px-8">
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setOpen(false)}
                    className="rounded-full border-[1.5px] border-ink bg-hl-yellow-strong px-7 py-2 text-[16px] font-bold text-ink hover:brightness-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
}

/** The typed-answer examples under the Math directions: answer, forms that get credit, forms that don't. */
function DirectionExamples({ rows }: { rows: readonly DirectionExample[] }) {
  const chips = (items: readonly string[]) => (
    <span className="flex flex-col items-center gap-2">
      {items.map((v) => (
        <code key={v} className="whitespace-pre rounded-[4px] bg-mist px-1.5 py-0.5 font-mono text-[15px] tracking-[0.12em] text-ink ring-1 ring-control">
          {v}
        </code>
      ))}
    </span>
  );
  return (
    <figure className="mt-4">
      <figcaption className="mb-2 text-center text-[16px] sm:text-[17px]">Examples</figcaption>
      <div className="overflow-x-auto">
        <table className="mx-auto border-collapse text-center text-[15px] leading-snug sm:text-[17px]">
          <thead>
            <tr>
              <th scope="col" className="border border-ink px-3 py-3 align-bottom font-normal">Answer</th>
              <th scope="col" className="border border-ink px-3 py-3 font-normal">Acceptable ways to<br />enter the answer</th>
              <th scope="col" className="border border-ink px-3 py-3 font-normal">Won’t get credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.answer}>
                <th scope="row" className="border border-ink px-5 py-4 font-normal">
                  <RichLine source={r.answer} />
                </th>
                <td className="border border-ink px-6 py-4">{chips(r.accepted)}</td>
                <td className="border border-ink px-6 py-4">{chips(r.rejected)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** The clock with its Hide/Show pill. Pass `remaining` in milliseconds; null draws nothing. */
export function ExamClock({
  remaining,
  mounted,
}: {
  remaining: number | null;
  mounted: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  if (remaining === null) return null;
  const low = remaining <= 5 * 60 * 1000;
  return (
    <>
      {!mounted ? (
        <span className="h-7" aria-hidden="true" />
      ) : hidden ? (
        <span
          className="flex h-8 items-center text-graphite"
          aria-label="Time hidden"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M9.5 2.5h5M12 2.5v3M18.5 6.5l1.5-1.5" />
            <circle cx="12" cy="13.5" r="7.5" />
            <path d="M12 13.5V9.5M12 13.5h3" />
          </svg>
        </span>
      ) : (
        <span
          className={cn(
            "text-[26px] font-bold leading-8 tabular-nums",
            low && "text-pine",
          )}
          aria-label={`Time left ${formatClock(remaining)}`}
        >
          {formatClock(remaining)}
        </span>
      )}
      <button
        type="button"
        onClick={() => setHidden((h) => !h)}
        className="rounded-full border-[1.5px] border-ink px-4 py-px text-[14px] font-bold hover:bg-paper"
      >
        {hidden ? "Show" : "Hide"}
      </button>
    </>
  );
}

/** m:ss (or h:mm:ss), never below zero. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** A tool in the top bar: icon over a label (label only for screen readers on phones). */
export function ToolButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  /** SVG paths on a 24 × 24 grid. */
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      // Pressed like Bluebook: a light box with a thick bar under the label.
      className={cn(
        "relative flex flex-col items-center gap-1 whitespace-nowrap rounded-t-lg px-1.5 py-1 text-[14px] font-medium sm:px-2",
        pressed
          ? "bg-paper/70 after:absolute after:inset-x-1 after:-bottom-1 after:h-[3px] after:rounded-full after:bg-ink"
          : "rounded-b-lg hover:bg-paper",
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {children}
      </svg>
      <span className="hidden sm:block">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  );
}

/** Highlighter tool for the top bar. */
export function HighlightTool({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <ToolButton label="Highlight" pressed={on} onClick={onToggle}>
      <path d="M4 20h6M14.5 4.5l5 5L10 19H5v-5z" />
    </ToolButton>
  );
}

type FullscreenDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function subscribeFullscreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);
  return () => {
    document.removeEventListener("fullscreenchange", onChange);
    document.removeEventListener("webkitfullscreenchange", onChange);
  };
}
const fullscreenSupported = () => {
  const d = document as FullscreenDoc;
  return Boolean(d.fullscreenEnabled || d.webkitFullscreenEnabled);
};
const inFullscreen = () => {
  const d = document as FullscreenDoc;
  return Boolean(d.fullscreenElement || d.webkitFullscreenElement);
};

/** Full screen switch in the top bar, next to Highlight. Hidden where the browser can't do it (iPhone). */
export function FullscreenTool() {
  const supported = useSyncExternalStore(
    subscribeFullscreen,
    fullscreenSupported,
    () => false,
  );
  const on = useSyncExternalStore(
    subscribeFullscreen,
    inFullscreen,
    () => false,
  );
  if (!supported) return null;
  const toggle = () => {
    const d = document as FullscreenDoc;
    const el = document.documentElement as FullscreenEl;
    try {
      if (on)
        void (d.exitFullscreen
          ? d.exitFullscreen()
          : d.webkitExitFullscreen?.());
      else
        void (el.requestFullscreen
          ? el.requestFullscreen()
          : el.webkitRequestFullscreen?.());
    } catch {
      // The browser refused (for example inside an embedded page); nothing else changes.
    }
  };
  return (
    <ToolButton
      label={on ? "Exit full screen" : "Full screen"}
      pressed={on}
      onClick={toggle}
    >
      {on ? (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      ) : (
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      )}
    </ToolButton>
  );
}

/** Light/dark switch in the top bar, next to Highlight. Doesn't touch the clock or answers. */
export function ThemeTool() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <ToolButton
      label={dark ? "Light mode" : "Dark mode"}
      pressed={false}
      onClick={toggle}
    >
      {dark ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </>
      ) : (
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      )}
    </ToolButton>
  );
}

/** The three-dots "More" tool; the menu content is up to the screen. */
export function MoreTool({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <ToolButton label="More" pressed={open} onClick={onToggle}>
        <circle cx="12" cy="5" r="1.3" fill="currentColor" />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" />
        <circle cx="12" cy="19" r="1.3" fill="currentColor" />
      </ToolButton>
      {open ? (
        <div
          role="menu"
          aria-label="More"
          className="absolute right-0 top-full z-40 mt-2 w-80 rounded-panel border border-hairline bg-paper p-2 shadow-lg"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** One choice in the More menu: a bold line and a plain explanation. */
export function MenuItem({
  title,
  detail,
  onClick,
  disabled,
}: {
  title: string;
  detail: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-choice px-4 py-3 text-left hover:bg-mist disabled:opacity-60"
    >
      <span className="block font-bold">{title}</span>
      <span className="block text-[13px] text-graphite">{detail}</span>
    </button>
  );
}

/** "Mark for Review" in the grey question bar. */
export function MarkForReviewButton({
  marked,
  onToggle,
}: {
  marked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={marked}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 text-[17px]",
        marked ? "font-medium" : "hover:underline",
      )}
    >
      <svg
        width="17"
        height="20"
        viewBox="0 0 16 18"
        aria-hidden="true"
        className={marked ? "text-flag" : ""}
      >
        <path
          d="M2.5 1.5h11v15L8 12.5l-5.5 4z"
          fill={marked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {marked ? "Marked for Review" : "Mark for Review"}
    </button>
  );
}

/** The ABC switch that turns on crossing out choices. */
export function CrossOutToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label="Cross out answer choices"
      title="Cross out answer choices"
      onClick={onToggle}
      className={cn(
        "rounded-md border-[1.5px] px-1.5 py-0.5 text-[13px] font-bold line-through decoration-[1.5px]",
        on
          ? "border-pine bg-pine text-pine-ink"
          : "border-ink bg-paper hover:bg-wash",
      )}
    >
      ABC
    </button>
  );
}

export function ClearHighlightsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mr-3 text-[13px] text-ink-soft hover:underline"
    >
      Clear highlights
    </button>
  );
}

/** Typed answer box for Math "student-produced response" questions. */
export function TypedAnswer({
  initial,
  onCommit,
  disabled,
}: {
  initial: string;
  onCommit: (value: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const timer = useRef<number | undefined>(undefined);
  return (
    <label className="flex max-w-xs flex-col gap-2 font-sans">
      <span className="text-[15px] font-bold">Your answer</span>
      <input
        value={value}
        inputMode="decimal"
        maxLength={6}
        autoComplete="off"
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value.replace(/[^0-9./-]/g, "");
          setValue(next);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => onCommit(next), 600);
        }}
        onBlur={() => {
          window.clearTimeout(timer.current);
          onCommit(value);
        }}
        className="rounded-choice border-[1.5px] border-control bg-paper px-4 py-3 text-lg tabular-nums outline-none focus:border-pine disabled:opacity-70"
      />
      <span className="text-[13px] text-graphite">
        Up to 5 characters for a positive answer, 6 for a negative one.
        Fractions like 3/4 are fine.
      </span>
    </label>
  );
}

/**
 * The dark "Question 3 of 27" button in the bottom bar that opens the question map.
 * Pass `current` and `total` for a question ("3 of 27" on phones), or a `label` such as "Review".
 */
export function MapButton({
  label,
  current,
  total,
  open,
  onClick,
}: {
  label?: string;
  current?: number;
  total?: number;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-ink px-3.5 py-2.5 text-[16px] font-bold text-paper tabular-nums sm:px-5 sm:text-[18px]"
    >
      {current !== undefined && total !== undefined ? (
        <>
          <span className="hidden sm:inline">Question </span>
          {current} of {total}
        </>
      ) : (
        label
      )}
      <Chevron
        className={cn("transition-transform", !open && "rotate-180")}
        strokeWidth={1.8}
      />
    </button>
  );
}

export type MapItemState =
  "unanswered" | "answered" | "correct" | "wrong" | "skipped";

export type MapItem = {
  id: string;
  /** The number shown on the square. */
  number: number;
  state: MapItemState;
  marked: boolean;
};

const STATE_LABEL: Record<MapItemState, string> = {
  unanswered: "Unanswered",
  answered: "Answered",
  correct: "Correct",
  wrong: "Incorrect",
  skipped: "Skipped",
};

const STATE_ORDER: MapItemState[] = [
  "unanswered",
  "answered",
  "correct",
  "wrong",
  "skipped",
];

/** The red bookmark that marks a question for review. */
export function ReviewFlag({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 16 18"
      aria-hidden="true"
      className={cn("text-flag", className)}
    >
      <path
        d="M2.5 1.5h11v15L8 12.5l-5.5 4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Pin({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="22"
      viewBox="0 0 18 22"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M9 20.5s7-6.2 7-11.5a7 7 0 1 0-14 0c0 5.3 7 11.5 7 11.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="9"
        cy="9"
        r="2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function Square({
  state,
  className,
}: {
  state: MapItemState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-sm",
        state === "unanswered" || state === "skipped"
          ? "border-[1.5px] border-dashed border-ink"
          : state === "answered"
            ? "bg-pine"
            : state === "correct"
              ? "bg-correct"
              : "bg-incorrect",
        className,
      )}
    />
  );
}

/** Legend for the question map: Current (when shown), the states in use, and For Review. */
export function MapLegend({
  items,
  current = false,
}: {
  items: readonly MapItem[];
  current?: boolean;
}) {
  const states = STATE_ORDER.filter(
    (s) => s !== "answered" && items.some((i) => i.state === s),
  );
  const inExam = items.some(
    (i) => i.state === "answered" || i.state === "unanswered",
  );
  if (inExam && !states.includes("unanswered")) states.unshift("unanswered");
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[16px]">
      {current ? (
        <span className="flex items-center gap-2">
          <Pin /> Current
        </span>
      ) : null}
      {states.map((s) => (
        <span key={s} className="flex items-center gap-2">
          <Square state={s} className="h-5 w-5" /> {STATE_LABEL[s]}
        </span>
      ))}
      <span className="flex items-center gap-2">
        <ReviewFlag size={16} /> For Review
      </span>
    </div>
  );
}

/** The grid of question numbers, with its legend above (turn the legend off to place it yourself). */
export function QuestionMapGrid({
  items,
  currentId,
  onPick,
  legend = true,
  className,
}: {
  items: readonly MapItem[];
  currentId?: string | null;
  onPick: (id: string) => void;
  legend?: boolean;
  /** Extra classes for the grid, e.g. a fixed number of columns. */
  className?: string;
}) {
  return (
    <>
      {legend ? (
        <div className="mb-8 border-b border-control pb-4">
          <MapLegend items={items} current={currentId !== undefined} />
        </div>
      ) : null}
      <ol
        className={cn(
          "grid grid-cols-[repeat(auto-fill,3rem)] justify-center gap-x-3 gap-y-6 pt-2 sm:gap-x-5 sm:gap-y-7",
          className,
        )}
      >
        {items.map((item) => {
          const isCurrent = item.id === currentId;
          return (
            <li key={item.id} className="relative">
              {isCurrent ? (
                <Pin className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2" />
              ) : null}
              <button
                type="button"
                onClick={() => onPick(item.id)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Question ${item.number}, ${STATE_LABEL[item.state].toLowerCase()}${item.marked ? ", marked for review" : ""}`}
                className={cn(
                  "flex h-12 w-12 items-center justify-center text-[20px] font-bold tabular-nums",
                  item.state === "answered"
                    ? "bg-pine text-pine-ink"
                    : item.state === "correct"
                      ? "bg-correct text-paper"
                      : item.state === "wrong"
                        ? "bg-incorrect text-paper"
                        : "border-[1.5px] border-dashed border-ink text-pine hover:bg-pine-tint",
                  isCurrent && "underline underline-offset-4",
                )}
              >
                {item.number}
              </button>
              {item.marked ? (
                <ReviewFlag
                  size={15}
                  className="pointer-events-none absolute -right-2 -top-2.5"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** The question map that opens above the bottom bar. */
export function QuestionMapPopover({
  title,
  onClose,
  children,
  footer,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed bottom-[96px] left-[calc(var(--exam-left,0px)+12px)] right-3 z-40 mx-auto max-w-[760px] font-sans">
      <div
        className="relative rounded-xl border border-hairline bg-paper px-5 pb-6 pt-5 shadow-xl sm:px-10"
        role="dialog"
        aria-label="Questions"
      >
        <div className="relative mb-4 flex items-center justify-center border-b border-control pb-4">
          <p className="px-10 text-center text-[18px] font-bold sm:text-[21px]">
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-0 rounded-full p-1.5 hover:bg-wash"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
              <path
                d="M5 5l12 12M17 5 5 17"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="max-h-[55dvh] overflow-y-auto px-1 pb-1">
          {children}
        </div>
        {footer ? (
          <div className="mt-7 flex justify-center gap-2">{footer}</div>
        ) : null}
        <span
          aria-hidden="true"
          className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-hairline bg-paper"
        />
      </div>
    </div>
  );
}

/** "Go to Review Page" at the bottom of the question map. */
export function GoToReviewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border-[1.5px] border-pine px-7 py-2.5 text-[17px] font-bold text-pine hover:bg-pine-tint"
    >
      Go to Review Page
    </button>
  );
}

/** The Check Your Work page at the end of a module: notes, then every question with its state. */
export function CheckYourWork({
  notes,
  cardTitle,
  items,
  onPick,
}: {
  notes: ReactNode;
  cardTitle: ReactNode;
  items: readonly MapItem[];
  onPick: (id: string) => void;
}) {
  return (
    <section className="mx-auto max-w-[860px] px-4 pb-10 pt-8 text-center font-sans sm:pt-12">
      <h1 className="text-[32px] font-normal sm:text-[42px]">
        Check Your Work
      </h1>
      <div className="mt-4 space-y-2 text-[16px] sm:text-[18px]">{notes}</div>
      <div className="mt-10 rounded-xl border border-hairline bg-paper px-5 pb-8 pt-6 text-left shadow-lg sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-control pb-5">
          <p className="text-[18px] font-bold sm:text-[20px]">{cardTitle}</p>
          <MapLegend items={items} />
        </div>
        <div className="pt-8">
          <QuestionMapGrid
            items={items}
            onPick={onPick}
            legend={false}
            className="md:grid-cols-[repeat(10,3rem)]"
          />
        </div>
      </div>
    </section>
  );
}

/** Full-screen message while a module closes and the next one (or the results) loads. */
export function ModuleOverScreen({
  title,
  next,
}: {
  title: string;
  next: string;
}) {
  return (
    <div
      className="exam fixed inset-0 z-[60] flex flex-col items-center justify-center bg-paper px-6 text-center"
      role="status"
    >
      <h1 className="text-[34px] font-light text-pine sm:text-[44px]">
        {title}
      </h1>
      <p className="mt-8 text-[18px] sm:text-[21px]">Your answers are saved.</p>
      <p className="mt-4 text-[18px] sm:text-[21px]">{next}</p>
      <p className="mt-4 text-[18px] sm:text-[21px]">
        Please don’t refresh or close this page.
      </p>
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="mt-12 animate-spin [animation-duration:1.6s]"
      >
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={32 + 24 * Math.cos(a)}
              cy={32 + 24 * Math.sin(a)}
              r={1.5 + i * 0.45}
              fill="currentColor"
            />
          );
        })}
      </svg>
    </div>
  );
}

/** A message under the top bar when something needs the student's attention. */
export function ExamProblem({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mx-auto mt-3 max-w-[1600px] px-4 font-sans sm:px-8"
    >
      <span className="block rounded-choice bg-wash px-4 py-2.5 text-[15px] font-semibold">
        {message}
      </span>
    </p>
  );
}

/** The hint shown while the highlighter is on. */
const SWATCH: Record<HighlightColor, string> = {
  yellow: "bg-hl-yellow",
  blue: "bg-hl-blue",
  pink: "bg-hl-pink",
};
const COLOR_NAME: Record<HighlightColor, string> = {
  yellow: "Yellow",
  blue: "Blue",
  pink: "Pink",
};

/** The floating menu for one highlight: pick a color, underline it, or delete it. Opens above the words. */
export function HighlightMenu({
  active,
  onColor,
  onUnderline,
  onDelete,
}: {
  active: ActiveHighlight;
  onColor: (c: HighlightColor) => void;
  onUnderline: () => void;
  onDelete: () => void;
}) {
  const above = active.top > 170;
  return (
    <div
      role="toolbar"
      aria-label="Highlight"
      className="exam fixed z-40 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-hairline bg-paper px-3 py-2 shadow-xl"
      style={{
        top: above ? active.top - 66 : active.bottom + 12,
        left: `clamp(170px, ${active.left}px, calc(100vw - 170px))`,
      }}
      onMouseUp={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {HIGHLIGHT_COLORS.map((c) => {
        const on = active.mark.color === c;
        return (
          <button
            key={c}
            type="button"
            aria-label={`${COLOR_NAME[c]} highlight`}
            aria-pressed={on}
            onClick={() => onColor(c)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] text-ink",
              SWATCH[c],
              on ? "border-[3px] border-ink" : "border-graphite",
            )}
          >
            {on ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
              </svg>
            ) : null}
          </button>
        );
      })}
      <button
        type="button"
        aria-label="Underline"
        aria-pressed={active.mark.underline}
        onClick={onUnderline}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full text-[18px] font-bold underline underline-offset-4",
          active.mark.underline ? "bg-ink text-paper" : "hover:bg-wash",
        )}
      >
        U
      </button>
      <span className="h-6 w-px bg-hairline" aria-hidden="true" />
      <button
        type="button"
        aria-label="Delete highlight"
        onClick={onDelete}
        className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-graphite hover:bg-wash"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  );
}

function Chevron({
  className,
  strokeWidth = 1.6,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={className}
    >
      <path
        d="m2 4 4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}
