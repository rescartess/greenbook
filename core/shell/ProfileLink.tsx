"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isSubjectSlug } from "@/core/config/subjects";

/** Phones: a small person icon in the top bar that opens the profile. */
export function ProfileLink() {
  const first = usePathname().split("/")[1];
  const subject = isSubjectSlug(first) ? first : "english";
  return (
    <Link
      href={`/${subject}/profile`}
      aria-label="Profile"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-graphite transition-colors hover:bg-mist hover:text-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 20.5c1.5-3.5 4.3-5 7.5-5s6 1.5 7.5 5" />
      </svg>
    </Link>
  );
}
