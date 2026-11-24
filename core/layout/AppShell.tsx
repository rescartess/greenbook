import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/core/design/ui";
import { BottomTabs } from "./SideNav";
import { SubjectSwitch } from "./SubjectSwitch";
import { ThemeToggle } from "./ThemeToggle";

/**
 * The logged-in frame: side tabs (laptops), icon rail (narrow windows) or bottom tabs (phones).
 * `nav` is the SideNav, passed in so its signed-in parts can load behind a Suspense boundary.
 */
export function AppShell({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto flex max-w-[1480px] gap-6 p-3 sm:p-5">
        {nav}
        <div className="min-w-0 flex-1 pb-28 sm:pb-6">
          <div className="mb-5 flex items-center justify-between sm:hidden">
            <Link href="/" className="text-ink">
              <Logo size={30} />
            </Link>
            <ThemeToggle />
          </div>
          {children}
        </div>
      </div>
      <Suspense fallback={null}>
        <BottomTabs />
      </Suspense>
    </div>
  );
}

/** Page title + the English/Math switch, top of every logged-in page. */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 pt-1 sm:pt-3">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-[40px] sm:leading-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-[17px] text-graphite">{subtitle}</p> : null}
      </div>
      <SubjectSwitch />
    </header>
  );
}
