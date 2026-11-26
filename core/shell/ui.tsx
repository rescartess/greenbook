import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/core/design/ui";

/**
 * Quiet building blocks for the pages around the exam (dashboard, topics, results...).
 * The exam keeps its own pieces in core/design/ui and core/question; nothing here touches them.
 */

/** A white surface with a hairline: 14px corners, 24px inside. */
export function Card({ className, children, ...rest }: ComponentProps<"section">) {
  return (
    <section className={cn("rounded-[14px] border border-hairline bg-paper p-5 sm:p-6", className)} {...rest}>
      {children}
    </section>
  );
}

type Tone = "primary" | "quiet";
const BTN = "inline-flex h-10 items-center justify-center rounded-[10px] px-[18px] text-[15px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";
const TONE: Record<Tone, string> = {
  primary: "bg-pine text-pine-ink hover:brightness-110",
  quiet: "border border-hairline bg-mist text-ink hover:bg-canvas",
};

export function Btn({ tone = "primary", className, ...rest }: ComponentProps<"button"> & { tone?: Tone }) {
  return <button className={cn(BTN, TONE[tone], className)} {...rest} />;
}

export function BtnLink({ tone = "primary", className, ...rest }: ComponentProps<typeof Link> & { tone?: Tone }) {
  return <Link className={cn(BTN, TONE[tone], className)} {...rest} />;
}

/**
 * GreenBook's signature: answer-sheet bubbles. One per question, filled when it is done.
 * Used only where progress is counted question by question.
 */
export function Bubbles({ done, total, label }: { done: number; total: number; label?: string }) {
  return (
    <div role="img" aria-label={label ?? `${done} of ${total} done`} className="grid grid-cols-[repeat(10,14px)] gap-x-2.5 gap-y-2">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn("h-3.5 w-3.5 rounded-full", i < done ? "bg-pine" : "border-[1.5px] border-graphite/45")}
        />
      ))}
    </div>
  );
}

/** Small meta text, like a count or a date. */
export function Meta({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-[13px] text-graphite tabular-nums", className)}>{children}</span>;
}
