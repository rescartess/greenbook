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

/**
 * Runs before the first paint so a saved theme never flashes. Someone who never chose gets dark
 * (owner request 28 Nov 2026: dark is the default for new visitors); "system" follows the device.
 */
export const THEME_SCRIPT = `(function(){try{var d=document.documentElement,t=localStorage.getItem("theme");if(t==="dark"||t==="light")d.setAttribute("data-theme",t);else if(t!=="system")d.setAttribute("data-theme","dark");var g=localStorage.getItem("design");if(g==="rainbow")g="strawberry";if(g==="strawberry"||g==="premium"||g==="study")d.setAttribute("data-design",g)}catch(e){}})()`;
