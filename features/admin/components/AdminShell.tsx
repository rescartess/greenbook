import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/core/design/ui";
import { BtnLink, RainbowStripe, Sticker, ThemeButton } from "@/core/shell";

/** Frame for admin pages: a flat top bar and a wide content column. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="gb-colors min-h-dvh bg-canvas">
      <RainbowStripe />
      <header className="sticky top-0 z-20 border-b border-hairline bg-paper pt-1.5">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5 text-ink">
            <Logo size={28} />
            <span className="inline-flex items-center gap-1.5 text-[15px] font-bold text-graphite">
              Admin <Sticker emoji="🛠️" size={16} tilt={0} />
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeButton />
            <BtnLink href="/english/dashboard" tone="quiet" className="h-9 px-3.5 text-[14px]">
              Student view
            </BtnLink>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-4 pb-20 pt-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}

export function AdminTitle({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6">
      {back ? (
        <Link
          href={back.href}
          className="text-[14px] font-semibold text-graphite hover:text-ink"
        >
          {back.label}
        </Link>
      ) : null}
      <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.01em] sm:text-[32px]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-[15px] text-graphite">{subtitle}</p>
      ) : null}
    </header>
  );
}

export function LoadingBlock({ height = 240 }: { height?: number }) {
  return (
    <div className="rounded-[var(--fp-r-card)] border border-hairline bg-paper" style={{ height }} />
  );
}
