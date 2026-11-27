import { Suspense } from "react";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { CardSkeleton, Empty, PageTitle } from "@/core/shell";
import { listFullTests, type FullTestRow } from "../queries";
import { FullTestsBrowser } from "./FullTestsBrowser";

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
  return (
    <FullTestsBrowser
      adaptive={tests.filter((t) => t.adaptive).sort(byMonth)}
      fixed={tests.filter((t) => !t.adaptive).sort(byMonth)}
    />
  );
}
