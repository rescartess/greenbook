"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button, cn, Icon } from "@/core/design/ui";

/*
 * The pieces of the Bluebook-style exam screen, shared by the timed test and by practice.
 * Flat full-width bars in pine tint with dashed rules (owner request), no glass.
 */

/** Top bar: title and directions on the left, clock in the middle, tools on the right. */
export function ExamTopBar({ left, center, right }: { left: ReactNode; center?: ReactNode; right: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-pine-tint font-sans">
      <div className="mx-auto grid min-h-[72px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-8">
        <div className="relative min-w-0">{left}</div>
        <div className="flex flex-col items-center gap-1" aria-live="polite">
          {center}
        </div>
        <div className="flex items-center justify-end gap-1 sm:gap-2">{right}</div>
      </div>
      <div className="border-b-[3px] border-dashed border-ink/70" />
    </header>
  );
}

/** Bottom bar: name on the left, question map button in the middle, Back/Next on the right. */
export function ExamBottomBar({ left, center, right }: { left?: ReactNode; center: ReactNode; right: ReactNode }) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 bg-pine-tint font-sans">
      <div className="border-t-[3px] border-dashed border-ink/70" />
      <div className="mx-auto grid h-[68px] max-w-[1600px] grid-cols-[auto_1fr] items-center gap-2 px-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:px-8">
        <span className="hidden min-w-0 truncate text-[15px] font-bold sm:block">{left}</span>
        <div className="sm:col-start-2">{center}</div>
        <div className="flex justify-end gap-1.5 sm:gap-2 [&>button]:max-sm:px-3.5">{right}</div>
      </div>
    </footer>
  );
}

/** Title line plus a "Directions" popover, for the left of the top bar. */
export function ExamTitle({ title, directions }: { title: ReactNode; directions?: readonly string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p className="truncate text-[15px] font-bold sm:text-[17px]">{title}</p>
      {directions?.length ? (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="mt-0.5 flex items-center gap-1 text-[15px] hover:underline"
          >
            Directions
            <Chevron className={cn("transition-transform", open && "rotate-180")} />
          </button>
          {open ? (
            <div
              role="dialog"
              aria-label="Directions"
              className="absolute left-0 top-full z-40 mt-3 w-[min(560px,90vw)] rounded-panel border border-hairline bg-paper p-6 shadow-lg"
            >
              {directions.map((d) => (
                <p key={d} className="mb-3 text-[15px] leading-relaxed last:mb-0">
                  {d}
                </p>
              ))}
              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

/** The clock with its Hide/Show pill. Pass `remaining` in milliseconds; null draws nothing. */
export function ExamClock({ remaining, mounted }: { remaining: number | null; mounted: boolean }) {
  const [hidden, setHidden] = useState(false);
  if (remaining === null) return null;
  const low = remaining <= 5 * 60 * 1000;
  return (
    <>
      {!mounted ? (
        <span className="h-7" aria-hidden="true" />
      ) : hidden ? (
        <span className="flex h-7 items-center text-sm text-graphite">Timer hidden</span>
      ) : (
        <span
          className={cn("text-[22px] font-bold leading-7 tabular-nums", low && "text-pine")}
          aria-label={`Time left ${formatClock(remaining)}`}
        >
          {formatClock(remaining)}
        </span>
      )}
      <button
        type="button"
        onClick={() => setHidden((h) => !h)}
        className="rounded-full border-[1.5px] border-ink px-3 py-px text-[13px] font-semibold hover:bg-paper"
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
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[13px] font-semibold",
        pressed ? "bg-ink text-paper" : "hover:bg-paper",
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
export function HighlightTool({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <ToolButton label="Highlight" pressed={on} onClick={onToggle}>
      <path d="M4 20h6M14.5 4.5l5 5L10 19H5v-5z" />
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
export function MarkForReviewButton({ marked, onToggle }: { marked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={marked}
      onClick={onToggle}
      className={cn("flex items-center gap-1.5 text-[15px]", marked ? "font-bold" : "hover:underline")}
    >
      <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true" className={marked ? "text-pine" : ""}>
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
export function CrossOutToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label="Cross out answer choices"
      title="Cross out answer choices"
      onClick={onToggle}
      className={cn(
        "rounded-md border-[1.5px] border-ink px-1.5 py-px text-[12px] font-bold line-through decoration-[1.5px]",
        on ? "bg-ink text-paper" : "bg-paper hover:bg-wash",
      )}
    >
      ABC
    </button>
  );
}

export function ClearHighlightsButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mr-3 text-[13px] text-ink-soft hover:underline">
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
        Up to 5 characters for a positive answer, 6 for a negative one. Fractions like 3/4 are fine.
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
      className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-[15px] font-bold text-paper tabular-nums sm:px-4"
    >
      {current !== undefined && total !== undefined ? (
        <>
          <span className="hidden sm:inline">Question </span>
          {current} of {total}
        </>
      ) : (
        label
      )}
      <Chevron className={cn("transition-transform", !open && "rotate-180")} strokeWidth={1.8} />
    </button>
  );
}

export type MapItemState = "unanswered" | "answered" | "correct" | "wrong" | "skipped";

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

const STATE_ORDER: MapItemState[] = ["unanswered", "answered", "correct", "wrong", "skipped"];

function Square({ state, className }: { state: MapItemState; className?: string }) {
  return (
    <span
      className={cn(
        "rounded",
        state === "unanswered" || state === "skipped"
          ? "border-[1.5px] border-dashed border-ink-soft"
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

/** The grid of question squares with a legend of the states it shows. */
export function QuestionMapGrid({
  items,
  currentId,
  onPick,
  legend = true,
}: {
  items: readonly MapItem[];
  currentId?: string | null;
  onPick: (id: string) => void;
  /** Turn off when several grids sit together and one legend is enough. */
  legend?: boolean;
}) {
  const states = STATE_ORDER.filter((s) => items.some((i) => i.state === s));
  if (states.includes("answered") && !states.includes("unanswered") && !states.includes("correct"))
    states.unshift("unanswered");
  return (
    <>
      <div className={cn("mb-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[13px] text-ink-soft", !legend && "hidden")}>
        {states.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <Square state={s} className="h-3.5 w-3.5" /> {STATE_LABEL[s]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <Icon name="bookmark" size={14} className="text-pine" /> For review
        </span>
      </div>
      <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <button
              type="button"
              onClick={() => onPick(item.id)}
              aria-current={item.id === currentId ? "step" : undefined}
              aria-label={`Question ${item.number}, ${STATE_LABEL[item.state].toLowerCase()}${item.marked ? ", marked for review" : ""}`}
              className={cn(
                "flex h-11 w-full items-center justify-center rounded-lg text-[15px] font-bold tabular-nums",
                item.state === "answered"
                  ? "bg-pine text-pine-ink"
                  : item.state === "correct"
                    ? "bg-correct text-paper"
                    : item.state === "wrong"
                      ? "bg-incorrect text-paper"
                      : "border-[1.5px] border-dashed border-ink-soft text-ink",
                item.id === currentId && "ring-2 ring-ink ring-offset-2 ring-offset-paper",
              )}
            >
              {item.number}
            </button>
            {item.marked ? (
              <Icon
                name="bookmark"
                size={15}
                className="pointer-events-none absolute -right-1.5 -top-1.5 rounded-full bg-paper text-pine"
              />
            ) : null}
          </li>
        ))}
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
    <div className="fixed inset-x-3 bottom-[84px] z-40 mx-auto max-w-[560px] font-sans">
      <div className="rounded-card border border-hairline bg-paper p-5 shadow-lg" role="dialog" aria-label="Questions">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="font-bold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-semibold hover:bg-wash"
          >
            Close
          </button>
        </div>
        <div className="max-h-[55dvh] overflow-y-auto p-1">{children}</div>
        {footer ? <div className="mt-5 flex justify-center gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

/** A message under the top bar when something needs the student's attention. */
export function ExamProblem({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mx-auto mt-3 max-w-[1600px] px-4 font-sans sm:px-8">
      <span className="block rounded-choice bg-wash px-4 py-2.5 text-[15px] font-semibold">{message}</span>
    </p>
  );
}

/** The hint shown while the highlighter is on. */
export function HighlightHint() {
  return (
    <p className="fixed inset-x-0 top-[86px] z-20 mx-auto w-fit rounded-full bg-ink px-4 py-1.5 font-sans text-[13px] font-semibold text-paper">
      Select words in the passage to highlight them
    </p>
  );
}

function Chevron({ className, strokeWidth = 1.6 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={className}>
      <path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}
