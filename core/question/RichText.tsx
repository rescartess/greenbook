import type { ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/core/design/ui";
import { parseRichText, type Block, type Inline } from "./rich-text";

function renderInline(nodes: Inline[], keyPrefix = ""): ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}${i}`;
    switch (node.kind) {
      case "text":
        return node.text;
      case "break":
        return <br key={key} />;
      case "math":
        return <MathText key={key} tex={node.tex} display={node.display} />;
      case "blank":
        return (
          <span
            key={key}
            role="img"
            aria-label="blank"
            className="mx-0.5 inline-block w-[4.5em] border-b-[1.5px] border-ink align-baseline"
          />
        );
      case "em":
        return <em key={key}>{renderInline(node.children, `${key}-`)}</em>;
      case "strong":
        return (
          <strong key={key} className="font-bold">
            {renderInline(node.children, `${key}-`)}
          </strong>
        );
      case "u":
        return (
          <u
            key={key}
            className="decoration-ink decoration-[1.5px] underline-offset-[3px]"
          >
            {renderInline(node.children, `${key}-`)}
          </u>
        );
    }
  });
}

/**
 * Math in LaTeX, drawn by KaTeX on the server. KaTeX builds its own markup from the formula and
 * escapes everything in it (no \href or other "trust" commands), so stored text still can't inject HTML.
 */
function MathText({ tex, display }: { tex: string; display: boolean }) {
  const html = katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    strict: "ignore",
    output: "htmlAndMathml",
  });
  return display ? (
    <span className="gb-math block overflow-x-auto py-1 text-center" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span className="gb-math" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function renderBlock(block: Block, i: number): ReactNode {
  if (block.kind === "paragraph")
    return <p key={i}>{renderInline(block.children)}</p>;
  if (block.kind === "list") {
    return (
      <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-graphite">
        {block.items.map((item, j) => (
          <li key={j}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }
  return (
    <div key={i} className="overflow-x-auto">
      <table className="w-full border-collapse text-[15px] leading-snug">
        <thead>
          <tr>
            {block.header.map((cell, j) => (
              <th
                key={j}
                scope="col"
                className="border border-control bg-mist px-3 py-2 text-left font-bold"
              >
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "border border-control px-3 py-2",
                    j > 0 && "tabular-nums",
                  )}
                >
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Draws question text in GreenBook's text format (see rich-text.ts). */
export function RichText({
  source,
  className,
  ...rest
}: {
  source: string;
  className?: string;
  "data-passage"?: boolean;
  "data-prompt"?: boolean;
}) {
  return (
    <div className={cn("space-y-4", className)} {...rest}>
      {parseRichText(source).map(renderBlock)}
    </div>
  );
}

/** One line of formatted text without paragraph spacing, e.g. an answer choice. */
export function RichLine({ source }: { source: string }) {
  const blocks = parseRichText(source);
  const only = blocks.length === 1 && blocks[0].kind === "paragraph" && blocks[0].children.length === 1 ? blocks[0].children[0] : null;
  // A choice that is just a formula is drawn full size (fractions as tall as on paper), like Bluebook.
  if (only?.kind === "math") return <MathText tex={`\\displaystyle ${only.tex}`} display={false} />;
  return <>{blocks.flatMap((b) => (b.kind === "paragraph" ? renderInline(b.children) : []))}</>;
}
