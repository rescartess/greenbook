"use client";

import { useState } from "react";
import { PillSwitch } from "@/core/design/ui";
import { SUBJECTS, SUBJECT_SLUGS, type SubjectSlug } from "@/core/config/subjects";

function describe(slug: SubjectSlug) {
  const s = SUBJECTS[slug];
  const total = s.modules * s.questionsPerModule;
  const minutes = s.modules * s.minutesPerModule;
  const extra = s.tools.includes("calculator") ? "with a built-in graphing calculator" : "with highlights and notes";
  return `${total} questions in ${s.modules} adaptive modules, ${minutes} minutes, ${extra}.`;
}

/** Homepage demo of the English/Math switch. Numbers come from core/config/subjects. */
export function SubjectShowcase() {
  const [subject, setSubject] = useState<SubjectSlug>("english");
  return (
    <div className="flex flex-col items-center">
      <PillSwitch
        label="Subject"
        size="lg"
        className="mt-11"
        options={SUBJECT_SLUGS.map((slug) => ({
          label: SUBJECTS[slug].label,
          active: slug === subject,
          onSelect: () => setSubject(slug),
        }))}
      />
      <p className="mt-9 text-2xl font-extrabold tracking-tight" aria-live="polite">
        {SUBJECTS[subject].name}
      </p>
      <p className="mt-2 max-w-[560px] text-[17px] leading-relaxed text-graphite">{describe(subject)}</p>
    </div>
  );
}
