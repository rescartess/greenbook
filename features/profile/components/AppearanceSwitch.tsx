"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/core/design/ui";

type Choice = "light" | "dark" | "system";
const CHOICES: { value: Choice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Match device" },
];

function current(): Choice {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage blocked: fall back to the device setting.
  }
  return "system";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** Light, dark, or follow the device. Remembered on this device, like the moon button. */
export function AppearanceSwitch() {
  const choice = useSyncExternalStore<Choice>(subscribe, current, () => "system");
  const pick = (value: Choice) => {
    try {
      if (value === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", value);
    } catch {
      // The look still changes for this visit.
    }
    if (value === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", value);
  };
  return (
    <div role="radiogroup" aria-label="Appearance" className="mt-3 flex rounded-[10px] border border-hairline bg-mist p-[3px]">
      {CHOICES.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={choice === c.value}
          onClick={() => pick(c.value)}
          className={cn(
            "flex-1 rounded-[7px] py-1.5 text-[14px] font-semibold transition-colors",
            choice === c.value ? "bg-paper text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-hairline" : "text-ink-soft hover:text-ink",
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
