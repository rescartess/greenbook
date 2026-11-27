"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

function currentTheme(): Theme {
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

/** The light/dark theme in use, and a way to switch it. The choice is remembered on this device. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore<Theme>(subscribe, currentTheme, () => "light");
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked (private mode); the theme still changes for this visit.
    }
  };
  return { theme, toggle };
}

/** The FreedomPrep designs a student can pick for the pages around the exam (see app/globals.css). */
export const DESIGNS = ["default", "rainbow", "premium", "study"] as const;
export type Design = (typeof DESIGNS)[number];

function currentDesign(): Design {
  const set = document.documentElement.getAttribute("data-design");
  return (DESIGNS as readonly string[]).includes(set ?? "") ? (set as Design) : "default";
}

function subscribeDesign(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-design"] });
  return () => observer.disconnect();
}

/** The design in use, and a way to switch it. The choice is remembered on this device. */
export function useDesign(): { design: Design; setDesign: (d: Design) => void } {
  const design = useSyncExternalStore<Design>(subscribeDesign, currentDesign, () => "default");
  const setDesign = (next: Design) => {
    const root = document.documentElement;
    if (next === "default") root.removeAttribute("data-design");
    else root.setAttribute("data-design", next);
    try {
      localStorage.setItem("design", next);
    } catch {
      // Storage can be blocked (private mode); the design still changes for this visit.
    }
  };
  return { design, setDesign };
}
