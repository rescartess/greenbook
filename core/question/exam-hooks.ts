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

/** Where highlights can go: the passage, and the question itself. */
type Area = "passage" | "prompt";
const AREAS: Area[] = ["passage", "prompt"];
/** Storage key per question and area (passage keeps the plain question id, as before). */
const areaKey = (questionId: string, area: Area) =>
  area === "passage" ? questionId : `${questionId}:prompt`;

/** The highlight being edited, and where its menu goes on screen. */
export type ActiveHighlight = {
  questionId: string;
  area: Area;
  span: Span;
  mark: Mark;
  top: number;
  bottom: number;
  left: number;
};

/**
 * Highlights for an exam screen (passage and question text), kept per question in this browser tab only.
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

  const areaEl = (area: Area) =>
    container.current?.querySelector<HTMLElement>(`[data-${area}]`) ?? null;

  // Show this question's highlights (drawn by the browser, not added to the page).
  useEffect(() => {
    paintHighlights(
      AREAS.map((area) => ({
        container: areaEl(area),
        marks: currentId ? (marks[areaKey(currentId, area)] ?? []) : [],
        active: shown?.area === area ? shown.span : null,
      })),
    );
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(marks));
    } catch {
      // Private browsing: highlights just won't survive a reload.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- areaEl reads the ref
  }, [
    container,
    currentId,
    marks,
    storageKey,
    shown?.area,
    shown?.span.start,
    shown?.span.end,
  ]);

  // The menu closes when the page scrolls or Escape is pressed.
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

  const open = (questionId: string, area: Area, mark: Mark) => {
    const el = areaEl(area);
    const rect = el ? markRect(el, mark) : null;
    if (!rect) return setActive(null);
    setActive({
      questionId,
      area,
      span: { start: mark.start, end: mark.end },
      mark,
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left + rect.width / 2,
    });
  };

  /** Call on mouse-up / touch-end on the screen, with where the pointer was. */
  const onPointerUp = (x: number, y: number) => {
    if (!currentId) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      if (!enabled) return;
      const range = selection.getRangeAt(0);
      for (const area of AREAS) {
        const el = areaEl(area);
        const span = el ? spanFromRange(el, range) : null;
        if (!span) continue;
        const mark: Mark = { ...span, color, underline: false };
        const key = areaKey(currentId, area);
        setMarks((all) => ({ ...all, [key]: addMark(all[key] ?? [], mark) }));
        selection.removeAllRanges();
        open(currentId, area, mark);
        return;
      }
      return;
    }
    for (const area of AREAS) {
      const el = areaEl(area);
      const offset = el ? offsetAtPoint(el, x, y) : null;
      if (offset === null) continue;
      const hit = markAt(marks[areaKey(currentId, area)] ?? [], offset);
      if (hit) return open(currentId, area, hit);
    }
    setActive(null);
  };

  const changeActive = (
    change: Partial<Pick<Mark, "color" | "underline">> | null,
  ) => {
    if (!shown) return;
    const key = areaKey(shown.questionId, shown.area);
    const list = marks[key] ?? [];
    const current = list.find(
      (m) => m.start === shown.span.start && m.end === shown.span.end,
    );
    if (!current) return setActive(null);
    if (change === null) {
      setMarks((all) => ({ ...all, [key]: list.filter((m) => m !== current) }));
      setActive(null);
      return;
    }
    const next = { ...current, ...change };
    if (change.color) setColor(change.color);
    setMarks((all) => ({
      ...all,
      [key]: list.map((m) => (m === current ? next : m)),
    }));
    setActive({ ...shown, mark: next });
  };

  const clear = (questionId: string) => {
    setMarks((all) => ({
      ...all,
      ...Object.fromEntries(AREAS.map((a) => [areaKey(questionId, a), []])),
    }));
    setActive(null);
  };

  /** Whether a question has any highlights (to show "Clear highlights"). */
  const has = (questionId: string) =>
    AREAS.some((a) => (marks[areaKey(questionId, a)] ?? []).length > 0);

  return {
    has,
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
