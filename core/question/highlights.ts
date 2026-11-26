/**
 * Passage highlights for the test screen. Uses the browser's CSS Custom Highlight API,
 * so React's markup is never changed. Highlights are stored as character offsets
 * into the passage text, which survive moving between questions.
 */

export type Span = { start: number; end: number };

export type HighlightColor = "yellow" | "blue" | "pink";
export const HIGHLIGHT_COLORS: HighlightColor[] = ["yellow", "blue", "pink"];

/** One highlight: where it is, its color and whether it is underlined. */
export type Mark = Span & { color: HighlightColor; underline: boolean };

/** Reads stored marks, including old ones saved before colors existed (they become yellow). */
export function toMarks(value: unknown): Mark[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is Record<string, unknown> => Boolean(m) && typeof m === "object",
    )
    .filter(
      (m) =>
        typeof m.start === "number" &&
        typeof m.end === "number" &&
        m.end > m.start,
    )
    .map((m) => ({
      start: m.start as number,
      end: m.end as number,
      color: HIGHLIGHT_COLORS.includes(m.color as HighlightColor)
        ? (m.color as HighlightColor)
        : "yellow",
      underline: m.underline === true,
    }));
}

/** Adds a highlight. Where it covers older ones, it replaces just the covered part. */
export function addMark(marks: Mark[], mark: Mark): Mark[] {
  const out: Mark[] = [];
  for (const m of marks) {
    if (m.end <= mark.start || m.start >= mark.end) out.push(m);
    else {
      if (m.start < mark.start) out.push({ ...m, end: mark.start });
      if (m.end > mark.end) out.push({ ...m, start: mark.end });
    }
  }
  out.push(mark);
  return out.sort((a, b) => a.start - b.start);
}

/** The highlight covering a character position, if any. */
export function markAt(marks: Mark[], offset: number): Mark | null {
  return marks.find((m) => offset >= m.start && offset < m.end) ?? null;
}

/** Sorts spans and joins any that touch or overlap. */
export function mergeSpans(spans: Span[]): Span[] {
  const sorted = spans
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start);
  const out: Span[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && s.start <= last.end) last.end = Math.max(last.end, s.end);
    else out.push({ ...s });
  }
  return out;
}

function textNodes(container: Node): Text[] {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode())
    nodes.push(n as Text);
  return nodes;
}

/** Where a selection starts and ends, counted in characters of the container's text. Null if outside. */
export function spanFromRange(
  container: HTMLElement,
  range: Range,
): Span | null {
  if (
    !container.contains(range.startContainer) ||
    !container.contains(range.endContainer)
  )
    return null;
  let offset = 0;
  let start = -1;
  let end = -1;
  for (const node of textNodes(container)) {
    if (node === range.startContainer) start = offset + range.startOffset;
    if (node === range.endContainer) end = offset + range.endOffset;
    offset += node.length;
  }
  if (start < 0 || end < 0 || end <= start) return null;
  return { start, end };
}

/** The character position under a point on screen (for tapping a highlight). Null if outside. */
export function offsetAtPoint(
  container: HTMLElement,
  x: number,
  y: number,
): number | null {
  type CaretDoc = Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const doc = document as CaretDoc;
  let node: Node | null = null;
  let at = 0;
  const pos = doc.caretPositionFromPoint?.(x, y);
  if (pos) {
    node = pos.offsetNode;
    at = pos.offset;
  } else {
    const r = doc.caretRangeFromPoint?.(x, y);
    if (r) {
      node = r.startContainer;
      at = r.startOffset;
    }
  }
  if (!node || !container.contains(node)) return null;
  let offset = 0;
  for (const t of textNodes(container)) {
    if (t === node) return offset + at;
    offset += t.length;
  }
  return null;
}

/** Where a highlight sits on screen (its first line), to place the highlight menu next to it. */
export function markRect(container: HTMLElement, span: Span): DOMRect | null {
  const range = rangeFromSpan(container, span);
  if (!range) return null;
  const rects = range.getClientRects();
  return rects.length ? rects[0] : range.getBoundingClientRect();
}

function rangeFromSpan(container: HTMLElement, span: Span): Range | null {
  const range = document.createRange();
  let offset = 0;
  let started = false;
  for (const node of textNodes(container)) {
    const next = offset + node.length;
    if (!started && span.start < next) {
      range.setStart(node, span.start - offset);
      started = true;
    }
    if (started && span.end <= next) {
      range.setEnd(node, span.end - offset);
      return range;
    }
    offset = next;
  }
  return null;
}

/** Shows the marks in the container, replacing whatever was highlighted before. The active one is drawn darker. */
export function paintHighlights(
  container: HTMLElement | null,
  marks: Mark[],
  active?: Span | null,
) {
  if (typeof CSS === "undefined" || !("highlights" in CSS)) return;
  const groups: Record<string, Range[]> = {
    "gb-yellow": [],
    "gb-blue": [],
    "gb-pink": [],
    "gb-underline": [],
  };
  const activeRanges: Range[] = [];
  for (const m of container ? marks : []) {
    const range = rangeFromSpan(container!, m);
    if (!range) continue;
    const isActive = active && active.start === m.start && active.end === m.end;
    if (isActive) activeRanges.push(range);
    else groups[`gb-${m.color}`].push(range);
    if (m.underline) groups["gb-underline"].push(range.cloneRange());
  }
  for (const [name, ranges] of Object.entries(groups)) {
    if (ranges.length) CSS.highlights.set(name, new Highlight(...ranges));
    else CSS.highlights.delete(name);
  }
  const activeMark = active
    ? marks.find((m) => m.start === active.start && m.end === active.end)
    : null;
  for (const c of HIGHLIGHT_COLORS) CSS.highlights.delete(`gb-${c}-active`);
  if (activeMark && activeRanges.length) {
    const h = new Highlight(...activeRanges);
    h.priority = 1;
    CSS.highlights.set(`gb-${activeMark.color}-active`, h);
  }
}

export function highlightsSupported() {
  return typeof CSS !== "undefined" && "highlights" in CSS;
}
