import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/core/design/ui";

/**
 * Quiet building blocks for the pages around the exam (dashboard, topics, results...).
 * The exam keeps its own pieces in core/design/ui and core/question; nothing here touches them.
 */

/** A white surface with a hairline: 14px corners, 24px inside (`flush`: no padding, for lists of rows). */
export function Card({ className, children, flush, ...rest }: ComponentProps<"section"> & { flush?: boolean }) {
  return (
    <section className={cn("rounded-[14px] border border-hairline bg-paper", !flush && "p-5 sm:p-6", className)} {...rest}>
      {children}
    </section>
  );
}

type Tone = "primary" | "quiet";
const BTN = "inline-flex h-10 disabled:opacity-50 items-center justify-center rounded-[10px] px-[18px] text-[15px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";
const TONE: Record<Tone, string> = {
  primary: "bg-pine text-pine-ink hover:brightness-110",
  quiet: "border border-hairline bg-mist text-ink hover:bg-canvas",
};

export function Btn({ tone = "primary", className, type = "button", ...rest }: ComponentProps<"button"> & { tone?: Tone }) {
  return <button type={type} className={cn(BTN, TONE[tone], className)} {...rest} />;
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

/** A segmented switch made of links, like English / Math. */
export function SegmentLinks({ label, options }: { label: string; options: { label: string; href: string; active: boolean }[] }) {
  return (
    <nav aria-label={label} className="flex w-fit rounded-[10px] border border-hairline bg-mist p-[3px]">
      {options.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.active ? "page" : undefined}
          className={cn(
            "rounded-[7px] px-4 py-1.5 text-[14px] font-semibold transition-colors",
            o.active ? "bg-paper text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-hairline" : "text-ink-soft hover:text-ink",
          )}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}

/** A plain empty state: what is missing and what to do. */
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="px-6 py-10 sm:px-8">
      <p className="text-[17px] font-bold">{title}</p>
      {children ? <p className="mt-1.5 max-w-xl text-[15px] text-ink-soft">{children}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

/** A quiet note next to a title, like "Draft, only you can see it". */
export function Note({ children }: { children: ReactNode }) {
  return <span className="text-[13px] font-semibold text-graphite">{children}</span>;
}

/** Loading placeholder with the card's shape. */
export function CardSkeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-[14px] border border-hairline bg-paper", className ?? "h-48")} />;
}
