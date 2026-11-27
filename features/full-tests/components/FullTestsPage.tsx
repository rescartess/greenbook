import { Suspense } from "react";
import { ESTIMATED_SCORES, SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { CardSkeleton, Empty, Note, PageTitle } from "@/core/shell";
import { listFullTests, type FullTestRow } from "../queries";
import { monthName } from "../schema";
import { AdaptivePicker } from "./AdaptivePicker";
import { StartTestButton } from "./StartTestButton";

export function FullTestsPage({ subject }: { subject: SubjectSlug }) {
  return (
    <FullTestsFrame subject={subject}>
      <Suspense fallback={<CardSkeleton />}>
        <TestList subject={subject} />
      </Suspense>
    </FullTestsFrame>
  );
}

async function TestList({ subject }: { subject: SubjectSlug }) {
  return <FullTestList subject={subject} tests={await listFullTests(subject)} />;
}

export function FullTestsFrame({ subject, children }: { subject: SubjectSlug; children: React.ReactNode }) {
  const s = SUBJECTS[subject];
  return (
    <>
      <PageTitle
        title="Full tests"
        subtitle={`${s.name}. Two modules. ${s.minutesPerModule} minutes each. No mercy.`}
      />
      {children}
    </>
  );
}

export function FullTestList({ subject, tests }: { subject: SubjectSlug; tests: FullTestRow[] }) {
  if (tests.length === 0) {
    return <Empty title="Not yet.">New {SUBJECTS[subject].name} tests drop here.</Empty>;
  }
  // Newest month first; tests without a month keep their order at the end.
  const byMonth = (a: FullTestRow, b: FullTestRow) => (b.month ?? "").localeCompare(a.month ?? "");
  const adaptive = tests.filter((t) => t.adaptive).sort(byMonth);
  const fixed = tests.filter((t) => !t.adaptive).sort(byMonth);
  return (
    <div className="flex flex-col gap-8">
      {adaptive.length ? <AdaptivePicker tests={adaptive} /> : null}
      {fixed.length ? (
        <section aria-labelledby="fixed-title" className="flex flex-col gap-4">
          {adaptive.length ? (
            <h2 id="fixed-title" className="text-[20px] font-bold">
              Tests by month
            </h2>
          ) : null}
          <FixedTests tests={fixed} />
        </section>
      ) : null}
    </div>
  );
}

function FixedTests({ tests }: { tests: FullTestRow[] }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      {tests.map((test) => {
        const letter = /\s([A-Z])$/.exec(test.title)?.[1] ?? null;
        return (
          <li key={test.id}>
            <article className="flex h-full flex-col rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[18px] font-bold leading-snug">{test.month ? monthName(test) : test.title}</h3>
                {letter ? (
                  <span
                    aria-label={`Version ${letter}`}
                    className="grid h-7 min-w-7 place-items-center rounded-[8px] border border-pine px-1.5 text-[14px] font-bold text-pine"
                  >
                    {letter}
                  </span>
                ) : null}
              </div>
              <ul className="mt-2 text-[15px] text-ink-soft">
                {test.moduleNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <p className="mt-3 text-[14px] text-graphite tabular-nums">
                {test.last
                  ? `Last score ${test.last.score ?? `${test.last.raw} correct`}${test.last.score && ESTIMATED_SCORES ? " (estimated)" : ""}`
                  : "Not taken yet"}
              </p>
              {!test.published ? (
                <p className="mt-1">
                  <Note>Draft, only you can see it</Note>
                </p>
              ) : null}
              <div className="mt-auto pt-5">
                <StartTestButton setId={test.id} label={test.inProgressId ? "Continue exam" : "Start exam"} />
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
