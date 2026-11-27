const QUESTIONS = [
  {
    q: "Is FreedomPrep really free?",
    a: "Yes. Full tests, practice by topic, your mistakes and scores are free for every student.",
  },
  {
    q: "How close is the test screen to Bluebook?",
    a: "As close as we can make it: the same layout, timer, Mark for Review, highlighter, answer eliminator and question map, in the same type. The design you pick never changes it.",
  },
  {
    q: "Where do the questions come from?",
    a: "From our own books, written for the digital SAT, and from College Board’s SAT Suite Question Bank, shown with credit and with College Board’s explanations.",
  },
  {
    q: "How is my score worked out?",
    a: "Each question’s level and module count, and Module 2 gets easier or harder from how you did in Module 1, like on test day. Scores are estimates on the 200 to 800 scale for each subject.",
  },
  {
    q: "What happens to questions I miss?",
    a: "They wait on your Mistakes page until you get each one right twice.",
  },
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
