const QUESTIONS = [
  { q: "Free?", a: "Yes. All of it." },
  { q: "Like Bluebook?", a: "Same layout. Same tools. Same pressure. Your design never touches it." },
  { q: "Where are the questions from?", a: "Our own books. And College Board’s question bank, credited." },
  { q: "How is it scored?", a: "Module 1 sets Module 2. Then 200 to 800 per subject, estimated." },
  { q: "Missed one?", a: "It waits. Get it right twice and it’s gone." },
];

/** Plain questions and answers, opened one at a time. */
export function Faq() {
  return (
    <div className="divide-y divide-hairline overflow-hidden rounded-[var(--fp-r-card)] border border-hairline bg-paper">
      {QUESTIONS.map((x) => (
        <details key={x.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
            {x.q}
            <span aria-hidden="true" className="relative h-4 w-4 shrink-0 text-graphite">
              <span className="absolute left-0 top-1/2 h-[1.5px] w-4 -translate-y-1/2 bg-current" />
              <span className="absolute left-1/2 top-0 h-4 w-[1.5px] -translate-x-1/2 bg-current transition-transform group-open:rotate-90 group-open:opacity-0" />
            </span>
          </summary>
          <p className="max-w-[720px] px-6 pb-6 text-[16px] leading-relaxed text-ink-soft">{x.a}</p>
        </details>
      ))}
    </div>
  );
}
