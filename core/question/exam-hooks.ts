"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import {
  addMark,
  markAt,
  markRect,
  offsetAtPoint,
  paintHighlights,
  spanFromRange,
  toMarks,
  type HighlightColor,
  type Mark,
  type Span,
} from "./highlights";

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

/** The highlight being edited, and where its menu goes on screen. */
export type ActiveHighlight = {
  questionId: string;
  span: Span;
  mark: Mark;
  top: number;
  bottom: number;
  left: number;
};

/**
 * Passage highlights for an exam screen, kept per question in this browser tab only.
 * With the Highlight tool on, selecting words highlights them (in the last color used) and opens the
 * highlight menu. Tapping a highlight at any time opens the menu: change its color, underline it, or delete it.
 */
export function useHighlights(
  storageKey: string,
  container: RefObject<HTMLElement | null>,
  currentId: string | null,
  enabled: boolean,
) {
  const [marks, setMarks] = useState<Record<string, Mark[]>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = JSON.parse(
        window.sessionStorage.getItem(storageKey) ?? "{}",
      ) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(saved).map(([k, v]) => [k, toMarks(v)]),
      );
    } catch {
      return {};
    }
  });
  const [color, setColor] = useState<HighlightColor>("yellow");
  const [active, setActive] = useState<ActiveHighlight | null>(null);
  const shown = active && active.questionId === currentId ? active : null;

  const passageEl = () =>
    container.current?.querySelector<HTMLElement>("[data-passage]") ?? null;

  // Show this question's highlights (drawn by the browser, not added to the page).
  useEffect(() => {
    paintHighlights(
      passageEl(),
      currentId ? (marks[currentId] ?? []) : [],
      shown?.span ?? null,
    );
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(marks));
    } catch {
      // Private browsing: highlights just won't survive a reload.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- passageEl reads the ref
  }, [
    container,
    currentId,
    marks,
    storageKey,
    shown?.span.start,
    shown?.span.end,
  ]);

  // The menu closes when the passage scrolls or Escape is pressed.
  useEffect(() => {
    if (!shown) return;
    const close = () => setActive(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [shown]);

  const open = (questionId: string, mark: Mark) => {
    const passage = passageEl();
    const rect = passage ? markRect(passage, mark) : null;
    if (!rect) return setActive(null);
    setActive({
      questionId,
      span: { start: mark.start, end: mark.end },
      mark,
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left + rect.width / 2,
    });
  };

  /** Call on mouse-up / touch-end in the passage area, with where the pointer was. */
  const onPointerUp = (x: number, y: number) => {
    if (!currentId) return;
    const passage = passageEl();
    if (!passage) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      if (!enabled) return;
      const span = spanFromRange(passage, selection.getRangeAt(0));
      if (!span) return;
      const mark: Mark = { ...span, color, underline: false };
      setMarks((all) => ({
        ...all,
        [currentId]: addMark(all[currentId] ?? [], mark),
      }));
      selection.removeAllRanges();
      open(currentId, mark);
      return;
    }
    const offset = offsetAtPoint(passage, x, y);
    const hit = offset === null ? null : markAt(marks[currentId] ?? [], offset);
    if (hit) open(currentId, hit);
    else setActive(null);
  };

  const changeActive = (
    change: Partial<Pick<Mark, "color" | "underline">> | null,
  ) => {
    if (!shown) return;
    const { questionId, span } = shown;
    const list = marks[questionId] ?? [];
    const current = list.find(
      (m) => m.start === span.start && m.end === span.end,
    );
    if (!current) return setActive(null);
    if (change === null) {
      setMarks((all) => ({
        ...all,
        [questionId]: list.filter((m) => m !== current),
      }));
      setActive(null);
      return;
    }
    const next = { ...current, ...change };
    if (change.color) setColor(change.color);
    setMarks((all) => ({
      ...all,
      [questionId]: list.map((m) => (m === current ? next : m)),
    }));
    setActive({ ...shown, mark: next });
  };

  const clear = (questionId: string) => {
    setMarks((all) => ({ ...all, [questionId]: [] }));
    setActive(null);
  };

  return {
    marks,
    onPointerUp,
    clear,
    active: shown,
    setActiveColor: (c: HighlightColor) => changeActive({ color: c }),
    toggleActiveUnderline: () =>
      changeActive({ underline: !shown?.mark.underline }),
    removeActive: () => changeActive(null),
    closeMenu: () => setActive(null),
  };
}
