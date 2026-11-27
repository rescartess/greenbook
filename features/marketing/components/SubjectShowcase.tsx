"use client";

import { useState } from "react";
import { cn } from "@/core/design/ui";
import { SUBJECTS, SUBJECT_SLUGS, type SubjectSlug } from "@/core/config/subjects";

function facts(slug: SubjectSlug) {
  const s = SUBJECTS[slug];
  return [
    { label: "Questions", value: String(s.modules * s.questionsPerModule) },
    { label: "Modules", value: String(s.modules) },
    { label: "Minutes", value: String(s.modules * s.minutesPerModule) },
  ];
}

/** Homepage demo of the English/Math switch. Numbers come from core/config/subjects. */
export function SubjectShowcase() {
  const [subject, setSubject] = useState<SubjectSlug>("english");
  const s = SUBJECTS[subject];
  return (
    <div className="rp-card rounded-[18px] border border-hairline bg-paper p-5 sm:p-6">
      <div role="radiogroup" aria-label="Subject" className="flex w-fit rounded-[10px] border border-hairline bg-mist p-[3px]">
        {SUBJECT_SLUGS.map((slug) => (
          <button
            key={slug}
            type="button"
            role="radio"
            aria-checked={slug === subject}
            onClick={() => setSubject(slug)}
            className={cn(
              "rounded-[7px] px-4 py-1.5 text-[14px] font-semibold transition-colors",
              slug === subject ? "rp-btn-primary bg-pine text-pine-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {SUBJECTS[slug].label}
          </button>
        ))}
      </div>
      <p className="mt-6 text-[20px] font-bold" aria-live="polite">
        {s.name}
      </p>
      <dl className="mt-4 grid grid-cols-3 gap-4 tabular-nums">
        {facts(subject).map((f) => (
          <div key={f.label} className="flex flex-col-reverse justify-end gap-1">
            <dt className="text-[14px] text-ink-soft">{f.label}</dt>
            <dd className="text-[32px] font-bold leading-none">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-[15px] text-ink-soft">
        {s.tools.includes("calculator") ? "With a built-in graphing calculator" : "With highlights and notes"}
      </p>
    </div>
  );
}
