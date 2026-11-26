import type { ReactNode } from "react";
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
  return (
    <>
      {parseRichText(source).flatMap((b) =>
        b.kind === "paragraph" ? renderInline(b.children) : [],
      )}
    </>
  );
}
