"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SUBJECT_SLUGS, SUBJECTS, isSubjectSlug, switchSubjectPath } from "@/core/config/subjects";
import { cn } from "@/core/design/ui";

/**
 * English / Math switch (owner request 27 Nov 2026: bigger and easier to see). A tinted track in the
 * design's main color; the chosen subject is a solid button. Keeps the page, swaps the subject.
 */
export function SubjectSegment() {
  const pathname = usePathname();
  const current = pathname.split("/")[1];
  const active = isSubjectSlug(current) ? current : "english";
  return (
    <nav aria-label="Subject" className="flex rounded-[var(--fp-r-btn)] border border-pine-soft bg-pine-tint p-1">
      {SUBJECT_SLUGS.map((slug) => {
        const on = slug === active;
        return (
          <Link
            key={slug}
            href={switchSubjectPath(pathname, slug)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "fp-label flex h-10 min-w-[92px] items-center justify-center rounded-[var(--fp-r-btn)] px-5 text-[16px] font-extrabold transition-colors",
              on ? "rp-btn-primary bg-pine text-pine-ink" : "text-pine hover:bg-paper/70",
            )}
          >
            {SUBJECTS[slug].label}
          </Link>
        );
      })}
    </nav>
  );
}
