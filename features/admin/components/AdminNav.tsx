"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/core/design/ui";

const LINKS = [
  { href: "/admin/students", label: "Students", match: (p: string) => p.startsWith("/admin/students") },
  {
    href: "/admin",
    label: "Tests",
    match: (p: string) => p === "/admin" || ["/admin/tests", "/admin/modules", "/admin/questions"].some((s) => p.startsWith(s)),
  },
  { href: "/admin/import", label: "Import", match: (p: string) => p.startsWith("/admin/import") },
  { href: "/admin/backup", label: "Backup", match: (p: string) => p.startsWith("/admin/backup") },
];

/** The admin's main menu: Students, Tests, Import, Backup. */
export function AdminNav() {
  return <AdminNavLinks path={usePathname()} />;
}

/** The links themselves; with no path (while the page loads) nothing is marked. */
export function AdminNavLinks({ path = "" }: { path?: string }) {
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto">
      {LINKS.map((l) => {
        const on = l.match(path);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "relative flex h-11 shrink-0 items-center px-3.5 text-[15px] font-semibold transition-colors",
              on ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[2.5px] after:rounded-full after:bg-pine" : "text-graphite hover:text-ink",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
