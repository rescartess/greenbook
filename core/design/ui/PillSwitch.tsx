import Link from "next/link";
import { cn } from "./cn";

export type PillOption = { label: string; href?: string; active: boolean; onSelect?: () => void };

type Props = { options: PillOption[]; label: string; size?: "md" | "lg"; className?: string };

/**
 * A glass capsule with one solid "lens" on the selected option.
 * Options can be links (subject switch) or buttons (in-page choices).
 */
export function PillSwitch({ options, label, size = "md", className }: Props) {
  const item = cn(
    "inline-flex items-center justify-center rounded-full font-bold transition-colors",
    size === "lg" ? "h-12 w-36 text-base" : "h-10 w-24 text-[15px] sm:w-28",
  );
  return (
    <div role="group" aria-label={label} className={cn("glass inline-flex rounded-full p-1", className)}>
      {options.map((o) => {
        const look = o.active ? "bg-pine text-pine-ink" : "text-ink-soft hover:text-ink";
        return o.href ? (
          <Link key={o.label} href={o.href} aria-current={o.active ? "page" : undefined} className={cn(item, look)}>
            {o.label}
          </Link>
        ) : (
          <button key={o.label} type="button" aria-pressed={o.active} onClick={o.onSelect} className={cn(item, look)}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
