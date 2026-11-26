import { Suspense } from "react";
import { ESTIMATED_SCORES, SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { BtnLink, Card, CardSkeleton, Empty, Note, PageTitle } from "@/core/shell";
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
    <Card flush>
      <ul className="divide-y divide-hairline">
        {tests.map((test) => (
          <li key={test.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2.5 text-[16px] font-bold">
                {test.title}
                {!test.published ? <Note>Draft, only you can see it</Note> : null}
              </p>
              <p className="mt-0.5 text-[14px] text-graphite tabular-nums">
                {test.questions} questions, {test.minutes} minutes
                {test.inProgressId ? ", in progress" : ""}
              </p>
            </div>
            {test.last ? (
              <div className="w-24 text-right">
                <p className="text-[22px] font-bold leading-none tabular-nums">{test.last.score ?? test.last.raw}</p>
                <p className="mt-1 text-[12px] text-graphite">
                  {test.last.score ? (ESTIMATED_SCORES ? "Last score, est." : "Last score") : "Last, correct"}
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap items-start gap-2">
              {test.last ? (
                <BtnLink href={`/${subject}/results/${test.last.attemptId}`} tone="quiet">
                  See results
                </BtnLink>
              ) : null}
              {test.inProgressId ? (
                <StartTestButton setId={test.id} label="Resume test" />
              ) : (
                <StartTestButton setId={test.id} label={test.last ? "Take again" : "Start test"} variant={test.last ? "quiet" : "primary"} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
