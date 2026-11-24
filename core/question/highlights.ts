/**
 * Passage highlights for the test screen. Uses the browser's CSS Custom Highlight API,
 * so React's markup is never changed. Highlights are stored as character offsets
 * into the passage text, which survive moving between questions.
 */

export type Span = { start: number; end: number };

/** Sorts spans and joins any that touch or overlap. */
export function mergeSpans(spans: Span[]): Span[] {
  const sorted = spans.filter((s) => s.end > s.start).sort((a, b) => a.start - b.start);
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
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  return nodes;
}

/** Where a selection starts and ends, counted in characters of the container's text. Null if outside. */
export function spanFromRange(container: HTMLElement, range: Range): Span | null {
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return null;
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

const NAME = "gb-mark";

/** Shows the given spans in the container, replacing whatever was highlighted before. */
export function paintHighlights(container: HTMLElement | null, spans: Span[]) {
  if (typeof CSS === "undefined" || !("highlights" in CSS)) return;
  if (!container || spans.length === 0) {
    CSS.highlights.delete(NAME);
    return;
  }
  const ranges = spans.map((s) => rangeFromSpan(container, s)).filter((r): r is Range => r !== null);
  CSS.highlights.set(NAME, new Highlight(...ranges));
}

export function highlightsSupported() {
  return typeof CSS !== "undefined" && "highlights" in CSS;
}
