"use client";

import { usePathname } from "next/navigation";
import { PillSwitch } from "@/core/design/ui";
import { SUBJECT_SLUGS, SUBJECTS, isSubjectSlug, switchSubjectPath } from "@/core/config/subjects";

/** The English/Math switch: keeps the user on the same page, swaps the subject. */
export function SubjectSwitch() {
  const pathname = usePathname();
  const current = pathname.split("/")[1];
  const active = isSubjectSlug(current) ? current : "english";
  return (
    <PillSwitch
      label="Subject"
      options={SUBJECT_SLUGS.map((slug) => ({
        label: SUBJECTS[slug].label,
        href: switchSubjectPath(pathname, slug),
        active: slug === active,
      }))}
    />
  );
}
