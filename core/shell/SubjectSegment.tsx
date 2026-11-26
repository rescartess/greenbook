"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SUBJECT_SLUGS, SUBJECTS, isSubjectSlug, switchSubjectPath } from "@/core/config/subjects";
import { cn } from "@/core/design/ui";

/** English / Math as a small segmented control. Keeps the page, swaps the subject. */
export function SubjectSegment() {
  const pathname = usePathname();
  const current = pathname.split("/")[1];
  const active = isSubjectSlug(current) ? current : "english";
  return (
    <nav aria-label="Subject" className="flex rounded-[10px] border border-hairline bg-mist p-[3px]">
      {SUBJECT_SLUGS.map((slug) => {
        const on = slug === active;
        return (
          <Link
            key={slug}
            href={switchSubjectPath(pathname, slug)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "rounded-[7px] px-4 py-1.5 text-[14px] font-semibold transition-colors",
              on ? "bg-paper text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-hairline" : "text-ink-soft hover:text-ink",
            )}
          >
            {SUBJECTS[slug].label}
          </Link>
        );
      })}
    </nav>
  );
}
