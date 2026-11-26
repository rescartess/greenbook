"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENABLED_FEATURES } from "@/core/config/features";
import { isSubjectSlug } from "@/core/config/subjects";
import { Icon, LogoMark, cn } from "@/core/design/ui";
import type { ShellBadges, ShellUser } from "@/core/layout/types";
import { ThemeButton } from "./ThemeButton";

function useNavState() {
  const pathname = usePathname();
  const [, first, second] = pathname.split("/");
  const subject = isSubjectSlug(first) ? first : "english";
  return { subject, activePath: second };
}

/**
 * Laptops (900px and wider): a flush side panel with names.
 * Narrow windows and tablets (640-900px): the same panel as a 64px icon rail.
 * Phones use BottomTabs instead.
 */
export function SideNav({
  user,
  badges = {},
  signOutAction,
}: {
  /** null while the signed-in student is still loading. */
  user: (ShellUser & { avatarUrl?: string | null }) | null;
  badges?: ShellBadges;
  signOutAction?: () => Promise<void>;
}) {
  const { subject, activePath } = useNavState();
  return (
    <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col border-r border-hairline bg-paper px-2 py-5 sm:flex nav:w-[248px] nav:px-3">
      <Link
        href={`/${subject}/dashboard`}
        aria-label="GreenBook dashboard"
        className="mb-6 flex items-center justify-center gap-2.5 text-ink nav:justify-start nav:px-2"
      >
        <LogoMark size={28} />
        <span className="hidden text-[17px] font-bold nav:inline">GreenBook</span>
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-0.5">
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
                "relative flex h-9 items-center justify-center gap-2.5 rounded-lg text-[15px] transition-colors nav:justify-start nav:px-2.5",
                active
                  ? "bg-mist font-semibold text-ink ring-1 ring-hairline ring-inset"
                  : "font-medium text-ink-soft hover:bg-mist hover:text-ink",
              )}
            >
              <Icon name={f.icon} size={18} className={active ? "text-pine" : "text-graphite"} />
              <span className="sr-only nav:not-sr-only nav:flex-1">{f.label}</span>
              {badge ? (
                <>
                  <span className="hidden text-[13px] font-medium text-graphite tabular-nums nav:inline">{badge}</span>
                  <span aria-hidden="true" className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-pine nav:hidden" />
                </>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-2 border-t border-hairline pt-4 nav:flex-row nav:items-center nav:gap-2.5 nav:px-1">
        {user ? (
          <div className="flex min-w-0 items-center gap-2.5 nav:flex-1">
            <Link
              href={`/${subject}/profile`}
              aria-label="Profile"
              aria-current={activePath === "profile" ? "page" : undefined}
              title={user.name}
              className={cn("flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mist text-[12px] font-bold text-ink-soft ring-1 ring-hairline hover:ring-pine", activePath === "profile" && "ring-2 ring-pine")}
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- small public photo, no resizing needed
                <img src={user.avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
              ) : (
                user.initials
              )}
            </Link>
            <span className="hidden min-w-0 nav:block">
              <Link href={`/${subject}/profile`} className="block truncate text-[14px] font-semibold hover:underline">
                {user.name}
              </Link>
              <span className="flex gap-3 text-[13px]">
                {user.isAdmin ? (
                  <Link href="/admin" className="text-pine hover:underline">
                    Admin
                  </Link>
                ) : null}
                {signOutAction ? (
                  <form action={signOutAction}>
                    <button type="submit" className="text-graphite hover:text-ink">
                      Log out
                    </button>
                  </form>
                ) : null}
              </span>
            </span>
          </div>
        ) : (
          <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-mist nav:flex-1" />
        )}
        <ThemeButton />
      </div>
    </aside>
  );
}

/** Phones: the same tabs in a flat bar along the bottom edge. */
export function BottomTabs() {
  const { subject, activePath } = useNavState();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-hairline bg-paper px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 sm:hidden"
    >
      {ENABLED_FEATURES.map((f) => {
        const active = f.path === activePath;
        return (
          <Link
            key={f.key}
            href={`/${subject}/${f.path}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[11px]",
              active ? "font-semibold text-pine" : "font-medium text-ink-soft",
            )}
          >
            <Icon name={f.icon} size={20} />
            <span className="truncate">{f.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Shown while the side panel loads: the same panel, without links. */
export function SideNavPlaceholder() {
  return (
    <aside aria-hidden="true" className="sticky top-0 hidden h-dvh w-16 shrink-0 border-r border-hairline bg-paper sm:block nav:w-[248px]" />
  );
}
