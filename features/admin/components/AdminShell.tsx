import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink, Logo } from "@/core/design/ui";
import { ThemeToggle } from "@/core/layout";

/** Frame for admin pages: a floating glass bar and a wide content column. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 px-3 pt-3 sm:px-5">
        <div className="glass mx-auto flex h-[54px] max-w-[1280px] items-center justify-between gap-3 rounded-full pl-4 pr-2">
          <Link href="/admin" className="flex items-center gap-2.5 text-ink">
            <Logo size={28} />
            <span className="text-[15px] font-semibold text-graphite">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ButtonLink href="/english/dashboard" variant="quiet" size="sm">
              Student view
            </ButtonLink>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-3 pb-20 pt-7 sm:px-5">
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
          className="text-[15px] font-semibold text-pine underline-offset-4 hover:underline"
        >
          {back.label}
        </Link>
      ) : null}
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-[38px] sm:leading-tight">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-[17px] text-graphite">{subtitle}</p>
      ) : null}
    </header>
  );
}

export function LoadingBlock({ height = 240 }: { height?: number }) {
  return (
    <div className="animate-pulse rounded-panel bg-paper" style={{ height }} />
  );
}
