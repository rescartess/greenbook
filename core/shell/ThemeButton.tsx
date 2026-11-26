"use client";

import { useTheme } from "@/core/design/theme";
import { Icon, cn } from "@/core/design/ui";

/** Light/dark switch for the pages around the exam: a quiet 32px square. */
export function ThemeButton({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-graphite transition-colors hover:bg-mist hover:text-ink", className)}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
    </button>
  );
}
