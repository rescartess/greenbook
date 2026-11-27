import { cn } from "@/core/design/ui";

/** A student's photo, or their initials on a soft circle. */
export function StudentAvatar({ url, name, size = 36, className }: { url: string | null; name: string; size?: number; className?: string }) {
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-mist font-bold text-ink-soft ring-1 ring-hairline", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- small public photo
        <img src={url} alt="" width={size} height={size} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        initials || "?"
      )}
    </span>
  );
}

/** A small grey label, like "Admin" or "Google". */
export function Tag({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-bold",
        strong ? "bg-pine text-pine-ink" : "bg-mist text-ink-soft ring-1 ring-inset ring-hairline",
      )}
    >
      {children}
    </span>
  );
}

/** One big number with a label under it. */
export function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper px-5 py-4">
      <p className="text-[13px] font-semibold text-graphite">{label}</p>
      <p className="mt-1 text-[28px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">{value}</p>
      {note ? <p className="mt-1.5 text-[13px] text-graphite">{note}</p> : null}
    </div>
  );
}
