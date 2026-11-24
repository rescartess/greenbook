import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

/** A flat content panel: paper background, hairline border, no shadow. */
export function Panel({ className, ...rest }: ComponentProps<"section">) {
  return <section className={cn("rounded-panel border border-hairline bg-paper p-7", className)} {...rest} />;
}

/** A filled accent panel for the one thing that matters most on a page. */
export function AccentPanel({ className, ...rest }: ComponentProps<"section">) {
  return <section className={cn("rounded-panel bg-pine p-7 text-pine-ink", className)} {...rest} />;
}

/** Shown on pages that are planned but not built yet. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Panel className="px-7 py-12 text-center">
      <p className="text-lg font-bold">{title}</p>
      {children ? <p className="mt-2 text-[15px] text-graphite">{children}</p> : null}
    </Panel>
  );
}
