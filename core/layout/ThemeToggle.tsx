"use client";

import { useTheme } from "@/core/design/theme";
import { Icon, cn } from "@/core/design/ui";

/** Light/dark button. The choice is remembered on this device. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={next === "dark" ? "Switch to dark mode" : "Switch to light mode"}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wash text-ink transition-colors hover:bg-hairline",
        className,
      )}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
    </button>
  );
}

/** Runs before the first paint so a saved dark theme never flashes light. */
export const THEME_SCRIPT = `(function(){try{var d=document.documentElement,t=localStorage.getItem("theme");if(t==="dark"||t==="light")d.setAttribute("data-theme",t);var g=localStorage.getItem("design");if(g==="rainbow")g="strawberry";if(g==="strawberry"||g==="premium"||g==="study")d.setAttribute("data-design",g)}catch(e){}})()`;
