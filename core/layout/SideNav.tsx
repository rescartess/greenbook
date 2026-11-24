"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENABLED_FEATURES } from "@/core/config/features";
import { isSubjectSlug } from "@/core/config/subjects";
import { Icon, Logo, cn } from "@/core/design/ui";
import { ThemeToggle } from "./ThemeToggle";
import type { ShellBadges, ShellUser } from "./types";

function useNavState() {
  const pathname = usePathname();
  const [, first, second] = pathname.split("/");
  const subject = isSubjectSlug(first) ? first : "english";
  return { subject, activePath: second };
}

/** Desktop and tablet: a floating glass panel of side tabs. */
export function SideNav({ user, badges }: { user: ShellUser; badges: ShellBadges }) {
  const { subject, activePath } = useNavState();
  return (
    <aside className="glass sticky top-5 hidden h-[calc(100dvh-40px)] w-64 shrink-0 flex-col rounded-card px-3.5 pb-4 pt-5 lg:flex">
      <Link href={`/${subject}/dashboard`} className="px-2 pb-6 text-ink">
        <Logo size={34} wordmarkClassName="text-[21px]" />
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-1">
        {ENABLED_FEATURES.map((f) => {
          const active = f.path === activePath;
          const badge = badges[subject]?.[f.key];
          return (
            <Link
              key={f.key}
              href={`/${subject}/${f.path}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-[46px] items-center gap-3 rounded-full px-3.5 text-base font-semibold transition-colors",
                active ? "bg-pine text-pine-ink" : "text-ink-soft hover:bg-wash hover:text-ink",
              )}
            >
              <Icon name={f.icon} />
              <span className="flex-1">{f.label}</span>
              {badge ? (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[13px] font-bold",
                    active ? "bg-white/20 text-pine-ink" : "bg-pine-tint text-pine",
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

      <div className="flex items-center gap-2.5 border-t border-hairline px-2 pt-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine-tint text-[15px] font-extrabold text-pine">
          {user.initials}
        </span>
        <Link href="#" className="min-w-0 flex-1 text-ink">
          <span className="block truncate text-[15px] font-bold">{user.name}</span>
          <span className="block text-[13px] text-graphite">View profile</span>
        </Link>
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
      className="glass fixed inset-x-3 bottom-3 z-30 flex justify-between rounded-full px-1.5 py-1.5 lg:hidden"
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
