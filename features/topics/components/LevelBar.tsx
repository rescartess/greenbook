import { cn } from "@/core/design/ui";
import type { Level } from "../schema";

const SHADE: Record<Level, string> = { easy: "bg-pine-soft", medium: "bg-pine", hard: "bg-ink" };

/** A thin bar split by how many easy, medium and hard questions a topic has. */
export function LevelBar({ counts, className }: { counts: Record<Level, number>; className?: string }) {
  const total = counts.easy + counts.medium + counts.hard;
  if (total === 0) return null;
  return (
    <div
      className={cn("flex h-2 gap-0.5 overflow-hidden rounded-full", className)}
      role="img"
      aria-label={`${counts.easy} easy, ${counts.medium} medium and ${counts.hard} hard questions`}
    >
      {(["easy", "medium", "hard"] as const).map((level) =>
        counts[level] > 0 ? (
          <span key={level} className={SHADE[level]} style={{ flexGrow: counts[level], flexBasis: 0 }} />
        ) : null,
      )}
    </div>
  );
}
