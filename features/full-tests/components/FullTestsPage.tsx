import { Suspense } from "react";
import { ButtonLink, EmptyState, Panel } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { ESTIMATED_SCORES, SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { listFullTests } from "../queries";
import { StartTestButton } from "./StartTestButton";

export function FullTestsPage({ subject }: { subject: SubjectSlug }) {
  const s = SUBJECTS[subject];
  return (
    <>
      <PageHeader title="Full tests" subtitle={s.name} />
      <p className="-mt-2 mb-6 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
        A full {s.name} section: two modules of {s.minutesPerModule} minutes each. Module 2 is easier or harder depending on
        how module 1 went, just like the real test.
      </p>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-panel bg-paper" />}>
        <TestList subject={subject} />
      </Suspense>
    </>
  );
}

async function TestList({ subject }: { subject: SubjectSlug }) {
  const tests = await listFullTests(subject);
  if (tests.length === 0) {
    return <EmptyState title="No full tests yet">New {SUBJECTS[subject].name} tests will appear here as soon as they’re published.</EmptyState>;
  }

  return (
    <Panel className="p-0">
      <ul className="divide-y divide-hairline">
        {tests.map((test) => (
          <li key={test.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5">
            <div className="min-w-0">
              <p className="text-lg font-bold">
                {test.title}
                {!test.published ? (
                  <span className="ml-2.5 rounded-full bg-wash px-2.5 py-0.5 align-middle text-[13px] font-bold text-ink-soft">
                    Draft, only you can see it
                  </span>
                ) : null}
              </p>
              <p className="text-[15px] text-graphite">
                {test.questions} questions, {test.minutes} minutes
                {test.last
                  ? `. Last score: ${test.last.score ?? `${test.last.raw} correct`}${test.last.score && ESTIMATED_SCORES ? " (estimated)" : ""}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-2.5">
              {test.last ? (
                <ButtonLink href={`/${subject}/results/${test.last.attemptId}`} variant="quiet">
                  See results
                </ButtonLink>
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
    </Panel>
  );
}
