"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENABLED_FEATURES } from "@/core/config/features";
import { isSubjectSlug } from "@/core/config/subjects";
import { Icon, LogoMark, cn } from "@/core/design/ui";
import { ThemeToggle } from "./ThemeToggle";
import type { ShellBadges, ShellUser } from "./types";

function useNavState() {
  const pathname = usePathname();
  const [, first, second] = pathname.split("/");
  const subject = isSubjectSlug(first) ? first : "english";
  return { subject, activePath: second };
}

/**
 * Laptops (900px and wider): a floating glass panel of side tabs with names.
 * Narrow windows and tablets (640-900px): the same panel as a slim icon rail.
 * Phones use BottomTabs instead.
 */
export function SideNav({
  user,
  badges = {},
  signOutAction,
}: {
  /** null while the signed-in student is still loading. */
  user: ShellUser | null;
  badges?: ShellBadges;
  signOutAction?: () => Promise<void>;
}) {
  const { subject, activePath } = useNavState();
  return (
    <aside className="glass sticky top-5 hidden h-[calc(100dvh-40px)] w-[76px] shrink-0 flex-col items-center rounded-card px-2.5 pb-4 pt-5 sm:flex nav:w-64 nav:items-stretch nav:px-3.5">
      <Link
        href={`/${subject}/dashboard`}
        aria-label="FreedomPrep dashboard"
        className="flex items-center gap-2.5 pb-6 text-ink nav:px-2"
      >
        <LogoMark size={34} />
        <span className="hidden text-[21px] font-extrabold tracking-tight nav:inline">FreedomPrep</span>
      </Link>

      <nav aria-label="Main" className="flex w-full flex-col gap-1">
        {ENABLED_FEATURES.map((f) => {
          const active = f.path === activePath;
          const badge = badges[subject]?.[f.key];
          return (
            <Link
              key={f.key}
              href={`/${subject}/${f.path}`}
              aria-current={active ? "page" : undefined}
              title={f.label}
              className={cn(
                "relative flex h-[46px] items-center justify-center gap-3 rounded-full text-base font-semibold transition-colors nav:justify-start nav:px-3.5",
                active ? "bg-pine text-pine-ink" : "text-ink-soft hover:bg-wash hover:text-ink",
              )}
            >
              <Icon name={f.icon} />
              <span className="sr-only nav:not-sr-only nav:flex-1">{f.label}</span>
              {badge ? (
                <span
                  className={cn(
                    "rounded-full text-[13px] font-bold",
                    "absolute right-1.5 top-1 h-2 w-2 overflow-hidden text-transparent nav:static nav:h-auto nav:w-auto nav:px-2.5 nav:py-0.5",
                    active ? "bg-pine-ink nav:bg-white/20 nav:text-pine-ink" : "bg-pine nav:bg-pine-tint nav:text-pine",
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex w-full flex-col items-center gap-2 border-t border-hairline pt-3 nav:flex-row nav:gap-2.5 nav:px-2">
        {user ? (
          <div className="flex min-w-0 items-center gap-2.5 text-ink nav:flex-1">
            <span
              title={user.name}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine-tint text-[15px] font-extrabold text-pine"
            >
              {user.initials}
            </span>
            <span className="hidden min-w-0 nav:block">
              <span className="block truncate text-[15px] font-bold">{user.name}</span>
              <span className="flex gap-3">
                {user.isAdmin ? (
                  <Link href="/admin" className="text-[13px] font-semibold text-pine hover:underline">
                    Admin
                  </Link>
                ) : null}
                {signOutAction ? (
                  <form action={signOutAction}>
                    <button type="submit" className="text-[13px] text-graphite hover:text-ink">
                      Log out
                    </button>
                  </form>
                ) : null}
              </span>
            </span>
          </div>
        ) : (
          <span aria-hidden="true" className="h-10 w-10 shrink-0 rounded-full bg-wash nav:flex-1 nav:rounded-full" />
        )}
        <ThemeToggle />
      </div>
    </aside>
  );
}

/** Phones: the same tabs as a glass bar at the bottom of the screen. */
export function BottomTabs() {
  const { subject, activePath } = useNavState();
  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-3 bottom-3 z-30 flex justify-between rounded-full px-1.5 py-1.5 sm:hidden"
    >
      {ENABLED_FEATURES.map((f) => {
        const active = f.path === activePath;
        return (
          <Link
            key={f.key}
            href={`/${subject}/${f.path}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[11px] font-bold",
              active ? "bg-pine text-pine-ink" : "text-ink-soft",
            )}
          >
            <Icon name={f.icon} size={19} />
            <span className="truncate">{f.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Shown while the side tabs load: the same glass panel, without links. Reads nothing from the URL. */
export function SideNavPlaceholder() {
  return (
    <aside
      aria-hidden="true"
      className="glass sticky top-5 hidden h-[calc(100dvh-40px)] w-[76px] shrink-0 rounded-card sm:block nav:w-64"
    />
  );
}
