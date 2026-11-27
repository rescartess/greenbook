import { describe, expect, it } from "vitest";
import { parseChoices } from "./choices";
import { parseInline, parseRichText, toPlainText } from "./rich-text";

describe("parseInline", () => {
  it("reads italic, bold, underline and blanks", () => {
    expect(
      parseInline("A *Title* is **bold**, <u>this</u> and ______."),
    ).toEqual([
      { kind: "text", text: "A " },
      { kind: "em", children: [{ kind: "text", text: "Title" }] },
      { kind: "text", text: " is " },
      { kind: "strong", children: [{ kind: "text", text: "bold" }] },
      { kind: "text", text: ", " },
      { kind: "u", children: [{ kind: "text", text: "this" }] },
      { kind: "text", text: " and " },
      { kind: "blank" },
      { kind: "text", text: "." },
    ]);
  });

  it("allows italics inside an underline", () => {
    expect(parseInline("<u>see *Beloved* now</u>")).toEqual([
      {
        kind: "u",
        children: [
          { kind: "text", text: "see " },
          { kind: "em", children: [{ kind: "text", text: "Beloved" }] },
          { kind: "text", text: " now" },
        ],
      },
    ]);
  });

  it("keeps unmatched markers as plain text", () => {
    expect(parseInline("5 * 3 and </u> end")).toEqual([
      { kind: "text", text: "5 * 3 and </u> end" },
    ]);
    expect(parseInline("<u>never closed")).toEqual([
      { kind: "text", text: "<u>never closed" },
    ]);
  });

  it("never produces HTML from stored text", () => {
    expect(parseInline("<script>alert(1)</script>")).toEqual([
      { kind: "text", text: "<script>alert(1)</script>" },
    ]);
  });
});

describe("parseRichText", () => {
  it("splits paragraphs, lists and tables", () => {
    const blocks = parseRichText(
      "**Title**\n\n| Country | 1995 |\n|---|---|\n| Peru | 0.38 |\n\nNotes:\n\n- One\n- *Two*",
    );
    expect(blocks.map((b) => b.kind)).toEqual([
      "paragraph",
      "table",
      "paragraph",
      "list",
    ]);
    const table = blocks[1];
    if (table.kind !== "table") throw new Error("expected table");
    expect(table.header).toHaveLength(2);
    expect(table.rows).toEqual([
      [[{ kind: "text", text: "Peru" }], [{ kind: "text", text: "0.38" }]],
    ]);
    const list = blocks[3];
    if (list.kind !== "list") throw new Error("expected list");
    expect(list.items[1]).toEqual([
      { kind: "em", children: [{ kind: "text", text: "Two" }] },
    ]);
  });

  it("turns plain text into readable words", () => {
    expect(toPlainText("The *word* is ______.")).toBe("The word is ____.");
  });
});

describe("parseChoices", () => {
  it("accepts the stored choice list", () => {
    expect(
      parseChoices([
        { id: "A", text: "x" },
        { id: "B", text: "y" },
      ]),
    ).toEqual([
      { id: "A", text: "x" },
      { id: "B", text: "y" },
    ]);
  });

  it("rejects anything else", () => {
    expect(parseChoices(null)).toEqual([]);
    expect(parseChoices([{ id: "A" }])).toEqual([]);
    expect(parseChoices("A,B")).toEqual([]);
  });
});

describe("math", () => {
  it("reads \\( \\) and \\[ \\] as math before any other mark", () => {
    expect(parseInline("If \\(x_1 * 2 = 3\\), then *x* is")).toEqual([
      { kind: "text", text: "If " },
      { kind: "math", tex: "x_1 * 2 = 3", display: false },
      { kind: "text", text: ", then " },
      { kind: "em", children: [{ kind: "text", text: "x" }] },
      { kind: "text", text: " is" },
    ]);
    expect(parseRichText("\\[\\frac{1}{2}\\]")).toEqual([
      { kind: "paragraph", children: [{ kind: "math", tex: "\\frac{1}{2}", display: true }] },
    ]);
  });

  it("keeps math inside table cells and in plain text", () => {
    const [table] = parseRichText("| \\(x\\) | y |\n|---|---|\n| 0 | \\(n + 24\\) |");
    expect(table).toMatchObject({ kind: "table", rows: [[[{ kind: "text", text: "0" }], [{ kind: "math", tex: "n + 24" }]]] });
    expect(toPlainText("Find \\(2x\\).")).toBe("Find 2x.");
  });

  it("leaves a lone \\( as text", () => {
    expect(parseInline("a \\( b")).toEqual([{ kind: "text", text: "a \\( b" }]);
  });
});
