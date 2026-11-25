import { cn } from "@/core/design/ui";

/** "Correct", "Incorrect" or "Skipped" in the grey question bar after a question is checked. */
export function VerdictTag({ correct, skipped, className }: { correct: boolean; skipped?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 font-sans text-[13px] font-bold",
        correct
          ? "bg-pine text-pine-ink"
          : skipped
            ? "border-[1.5px] border-dashed border-ink-soft text-ink"
            : "border-[1.5px] border-ink text-ink",
        className,
      )}
    >
      {correct ? "Correct" : skipped ? "Skipped" : "Incorrect"}
    </span>
  );
}
