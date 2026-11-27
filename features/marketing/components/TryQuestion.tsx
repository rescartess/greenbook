"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/core/design/ui";

/**
 * A real, answerable question on the home page (our own wording, not from any test). It looks like the
 * test screen: a top bar with a running clock, the passage, four choices. Picking one checks it at once.
 * It is a demo: the real test screen grades on the server and never sends answers early.
 */
const PASSAGE =
  "Beekeepers in the Fergana Valley noticed that hives placed beside wildflower meadows made honey with far more varied flavors than hives beside single-crop cotton fields. A study of the pollen in each jar confirmed it: the more kinds of flowers near a hive, the more kinds of pollen in its honey. The flavor of honey, it seems, is ______ the plants that surround the hive.";

const CHOICES = [
  { letter: "A", text: "shaped by" },
  { letter: "B", text: "unrelated to" },
  { letter: "C", text: "hidden from" },
  { letter: "D", text: "older than" },
];
const RIGHT = "A";
const WHY =
  "The study links more kinds of nearby flowers to more kinds of pollen and flavor, so the plants shape the honey.";

function clock(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function TryQuestion() {
  const [left, setLeft] = useState(90);
  const [picked, setPicked] = useState<string | null>(null);
  const done = picked !== null;

  useEffect(() => {
    if (done || left === 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, done]);

  return (
    <div id="try" className="fp-try relative scroll-mt-28 overflow-hidden rounded-[22px] border border-hairline bg-paper">
      <div className="flex h-12 items-center justify-between gap-3 border-b border-dashed border-control px-5 text-[13px]">
        <p className="truncate font-semibold">Try one question</p>
        <p className={cn("text-[16px] font-bold tabular-nums", left <= 10 && !done && "text-incorrect")} aria-label="Time left">
          {done ? "Done" : clock(left)}
        </p>
        <p className="hidden text-graphite sm:block">Question 1 of 1</p>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.05fr_1fr]">
        <p className="border-hairline px-5 py-5 font-serif text-[15px] leading-[1.7] md:border-r">{PASSAGE}</p>
        <div className="px-5 py-5">
          <p className="font-serif text-[15px] leading-[1.6]">Which choice completes the text with the most logical and precise words?</p>
          <div role="radiogroup" aria-label="Answer choices" className="mt-4 grid gap-2.5">
            {CHOICES.map((c) => {
              const mine = picked === c.letter;
              const right = done && c.letter === RIGHT;
              const wrong = mine && c.letter !== RIGHT;
              return (
                <button
                  key={c.letter}
                  type="button"
                  role="radio"
                  aria-checked={mine}
                  disabled={done}
                  onClick={() => setPicked(c.letter)}
                  className={cn(
                    "flex items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left font-serif text-[15px] transition-colors",
                    right
                      ? "border-correct bg-correct-tint"
                      : wrong
                        ? "border-incorrect bg-incorrect-tint"
                        : "border-control enabled:hover:border-ink disabled:opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-sans text-[12px] font-bold",
                      right ? "border-correct bg-correct text-paper" : wrong ? "border-incorrect bg-incorrect text-paper" : "border-ink",
                    )}
                  >
                    {c.letter}
                  </span>
                  {c.text}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex min-h-[64px] flex-wrap items-center justify-between gap-3 border-t border-dashed border-control px-5 py-3" aria-live="polite">
        {done ? (
          <>
            <p className="max-w-[440px] text-[14px] leading-snug text-ink-soft">
              <span className={cn("font-bold", picked === RIGHT ? "text-correct" : "text-incorrect")}>
                {picked === RIGHT ? "Correct. " : "Not this time. "}
              </span>
              {WHY}
            </p>
            <Link href="/login" className="rp-btn-primary fp-label inline-flex h-9 items-center rounded-[var(--fp-r-btn)] bg-pine px-4 text-[14px] font-bold text-pine-ink">
              97 more in a full test
            </Link>
          </>
        ) : (
          <p className="text-[14px] text-graphite">Pick an answer. It is checked right away</p>
        )}
      </div>
    </div>
  );
}
