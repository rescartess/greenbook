"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { mergeSpans, paintHighlights, spanFromRange, type Span } from "./highlights";

const noopSubscribe = () => () => {};

/**
 * False while the server draws the page and during hydration, true once running in the browser.
 * Clocks and highlights wait for it, so the server's and the browser's first drawing match.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Passage highlights for an exam screen, kept per question in this browser tab only.
 * Returns the highlights, a handler to call on mouse-up/touch-end, and a way to clear one question.
 */
export function useHighlights(
  storageKey: string,
  container: RefObject<HTMLElement | null>,
  currentId: string | null,
  enabled: boolean,
) {
  const [marks, setMarks] = useState<Record<string, Span[]>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.sessionStorage.getItem(storageKey) ?? "{}");
    } catch {
      return {};
    }
  });

  // Show this question's highlights (drawn by the browser, not added to the page).
  useEffect(() => {
    const passage = container.current?.querySelector<HTMLElement>("[data-passage]") ?? null;
    paintHighlights(passage, currentId ? (marks[currentId] ?? []) : []);
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(marks));
    } catch {
      // Private browsing: highlights just won't survive a reload.
    }
  }, [container, currentId, marks, storageKey]);

  const addFromSelection = () => {
    if (!enabled || !currentId) return;
    const passage = container.current?.querySelector<HTMLElement>("[data-passage]");
    const selection = window.getSelection();
    if (!passage || !selection || selection.isCollapsed || selection.rangeCount === 0) return;
    const span = spanFromRange(passage, selection.getRangeAt(0));
    if (!span) return;
    setMarks((all) => ({ ...all, [currentId]: mergeSpans([...(all[currentId] ?? []), span]) }));
    selection.removeAllRanges();
  };

  const clear = (questionId: string) => setMarks((all) => ({ ...all, [questionId]: [] }));

  return { marks, addFromSelection, clear };
}
