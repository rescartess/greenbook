import { Suspense } from "react";
import { ESTIMATED_SCORES, SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { CardSkeleton, Empty, Note, PageTitle } from "@/core/shell";
import { listFullTests, type FullTestRow } from "../queries";
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
        subtitle={`${s.name}: two modules of ${s.minutesPerModule} minutes each. Module 2 is easier or harder depending on how module 1 went, like the real test.`}
      />
      {children}
    </>
  );
}

export function FullTestList({ subject, tests }: { subject: SubjectSlug; tests: FullTestRow[] }) {
  if (tests.length === 0) {
    return <Empty title="No full tests yet">New {SUBJECTS[subject].name} tests will appear here as soon as they’re published.</Empty>;
  }
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      {tests.map((test) => (
        <li key={test.id}>
          <article className="flex h-full flex-col rounded-[14px] border border-hairline bg-paper p-5">
            <h2 className="text-[18px] font-bold leading-snug">{test.title}</h2>
            <p className="mt-1 text-[14px] text-graphite tabular-nums">
              {test.last
                ? `Last score ${test.last.score ?? `${test.last.raw} correct`}${test.last.score && ESTIMATED_SCORES ? " (estimated)" : ""}`
                : "Not taken yet"}
            </p>
            {!test.published ? (
              <p className="mt-1">
                <Note>Draft, only you can see it</Note>
              </p>
            ) : null}
            <p className="mt-4 text-[15px] text-ink-soft tabular-nums">{test.questions} questions</p>
            <p className="mt-0.5 text-[14px] text-graphite tabular-nums">{test.minutes} minutes</p>
            <div className="mt-auto pt-5">
              <StartTestButton setId={test.id} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
