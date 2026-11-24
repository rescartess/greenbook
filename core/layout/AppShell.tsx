import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/core/design/ui";
import { BottomTabs, SideNav } from "./SideNav";
import { SubjectSwitch } from "./SubjectSwitch";
import { ThemeToggle } from "./ThemeToggle";
import type { ShellBadges, ShellUser } from "./types";

/** The logged-in frame: side tabs (desktop) or bottom tabs (phone) around the page. */
export function AppShell({
  user,
  badges,
  children,
}: {
  user: ShellUser;
  badges: ShellBadges;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto flex max-w-[1480px] gap-6 p-3 sm:p-5">
        <SideNav user={user} badges={badges} />
        <div className="min-w-0 flex-1 pb-28 lg:pb-6">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <Link href="/" className="text-ink">
              <Logo size={30} />
            </Link>
            <ThemeToggle />
          </div>
          {children}
        </div>
      </div>
      <BottomTabs />
    </div>
  );
}

/** Page title + the English/Math switch, top of every logged-in page. */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 pt-1 lg:pt-3">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-[40px] sm:leading-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-[17px] text-graphite">{subtitle}</p> : null}
      </div>
      <SubjectSwitch />
    </header>
  );
}
