import { Suspense } from "react";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { BtnLink, CardSkeleton, Empty, PageTitle } from "@/core/shell";
import { retakeAttempt } from "../actions";
import { listAttempts } from "../queries";
import type { AttemptSummary } from "../schema";
import { ResultsBoard } from "./ResultsBoard";

export function ResultsPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageTitle title="Results" subtitle={`${SUBJECTS[subject].name}. Every attempt, kept.`} />
      <Suspense fallback={<CardSkeleton className="h-72" />}>
        <AttemptList subject={subject} />
      </Suspense>
    </>
  );
}

async function AttemptList({ subject }: { subject: SubjectSlug }) {
  return <AttemptsView subject={subject} attempts={await listAttempts(subject)} />;
}

export function AttemptsView({ subject, attempts }: { subject: SubjectSlug; attempts: AttemptSummary[] }) {
  if (attempts.length === 0) {
    return (
      <Empty title="Nothing here. Yet." action={<BtnLink href={`/${subject}/topics`}>Practice a topic</BtnLink>}>
        Finish something. It shows up here.
      </Empty>
    );
  }
  return <ResultsBoard subject={subject} attempts={attempts} retake={retakeAttempt} />;
}
