/**
 * The small text format used inside questions, turned into a tree that
 * RichText.tsx draws. Never renders raw HTML, so stored text can't inject markup.
 *
 * Supported (and nothing else):
 *   *italic*   **bold**   <u>underlined</u>   ______ (a blank, 3+ underscores)
 *   blank line = new paragraph, single line break = line break
 *   "- " at the start of every line = bullet list (student notes)
 *   "| a | b |" lines = table (first row is the header; the "|---|" row is skipped)
 */

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "blank" }
  | { kind: "break" }
  | { kind: "em" | "strong" | "u"; children: Inline[] };

export type Block =
  | { kind: "paragraph"; children: Inline[] }
  | { kind: "list"; items: Inline[][] }
  | { kind: "table"; header: Inline[][]; rows: Inline[][][] };

type Mark = "em" | "strong" | "u";
type Token = { kind: "text"; text: string } | { kind: "blank" } | { kind: "break" } | { kind: "mark"; mark: Mark; raw: string; close?: boolean };

const TOKEN = /(\*\*|\*|<u>|<\/u>|_{3,}|\n)/g;

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of source.matchAll(TOKEN)) {
    const at = match.index ?? 0;
    if (at > last) tokens.push({ kind: "text", text: source.slice(last, at) });
    const raw = match[0];
    if (raw === "\n") tokens.push({ kind: "break" });
    else if (raw.startsWith("___")) tokens.push({ kind: "blank" });
    else if (raw === "**") tokens.push({ kind: "mark", mark: "strong", raw });
    else if (raw === "*") tokens.push({ kind: "mark", mark: "em", raw });
    else if (raw === "<u>") tokens.push({ kind: "mark", mark: "u", raw });
    else tokens.push({ kind: "mark", mark: "u", raw, close: true });
    last = at + raw.length;
  }
  if (last < source.length) tokens.push({ kind: "text", text: source.slice(last) });
  return tokens;
}

function pushText(into: Inline[], text: string) {
  if (!text) return;
  const prev = into[into.length - 1];
  if (prev?.kind === "text") prev.text += text;
  else into.push({ kind: "text", text });
}

/** Parse one paragraph or cell. Unmatched markers are kept as plain text. */
export function parseInline(source: string): Inline[] {
  type Frame = { mark: Mark | null; raw: string; children: Inline[] };
  const stack: Frame[] = [{ mark: null, raw: "", children: [] }];
  const top = () => stack[stack.length - 1];

  for (const token of tokenize(source)) {
    if (token.kind === "text") pushText(top().children, token.text);
    else if (token.kind === "blank" || token.kind === "break") top().children.push({ kind: token.kind });
    else {
      const closes = token.mark === "u" ? token.close : top().mark === token.mark;
      if (closes && top().mark === token.mark) {
        const done = stack.pop()!;
        top().children.push({ kind: token.mark, children: done.children });
      } else if (token.mark === "u" && token.close) {
        pushText(top().children, token.raw);
      } else {
        stack.push({ mark: token.mark, raw: token.raw, children: [] });
      }
    }
  }

  // Close anything left open by turning its marker back into text.
  while (stack.length > 1) {
    const open = stack.pop()!;
    pushText(top().children, open.raw);
    for (const child of open.children) {
      if (child.kind === "text") pushText(top().children, child.text);
      else top().children.push(child);
    }
  }
  return stack[0].children;
}

function cells(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

/** Parse a whole passage or prompt into blocks. */
export function parseRichText(source: string): Block[] {
  const blocks: Block[] = [];
  const chunks = source.replace(/\r\n/g, "\n").trim().split(/\n\s*\n/);

  for (const chunk of chunks) {
    const lines = chunk.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;

    if (lines.every((l) => l.trimStart().startsWith("- "))) {
      blocks.push({ kind: "list", items: lines.map((l) => parseInline(l.trimStart().slice(2))) });
    } else if (lines.every((l) => l.trimStart().startsWith("|"))) {
      const rows = lines.filter((l) => !/^\s*\|?\s*:?-{2,}/.test(l)).map((l) => cells(l).map(parseInline));
      const [header = [], ...body] = rows;
      blocks.push({ kind: "table", header, rows: body });
    } else {
      blocks.push({ kind: "paragraph", children: parseInline(lines.join("\n")) });
    }
  }
  return blocks;
}

/** Plain text without formatting, for previews and screen-reader labels. */
export function toPlainText(source: string): string {
  const flatten = (nodes: Inline[]): string =>
    nodes
      .map((n) => (n.kind === "text" ? n.text : n.kind === "blank" ? "____" : n.kind === "break" ? " " : flatten(n.children)))
      .join("");
  return parseRichText(source)
    .map((b) =>
      b.kind === "paragraph"
        ? flatten(b.children)
        : b.kind === "list"
          ? b.items.map(flatten).join(" ")
          : [b.header, ...b.rows].map((r) => r.map(flatten).join(" ")).join(" "),
    )
    .join(" ");
}
