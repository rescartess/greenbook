import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { SUBJECTS, isSubjectSlug } from "@/core/config/subjects";
import { getCurrentUser } from "@/features/auth";
import { getTestState, nextSectionAfter } from "../queries";
import { TestRunner } from "./TestRunner";

export function TestRunnerPage({ attemptId }: { attemptId: Promise<string> }) {
  return (
    <Suspense fallback={<Loading />}>
      <Runner attemptId={attemptId} />
    </Suspense>
  );
}

async function Runner({ attemptId }: { attemptId: Promise<string> }) {
  const id = await attemptId;
  const [user, state] = await Promise.all([getCurrentUser(), getTestState(id)]);
  if (!state) notFound();
  const subject = isSubjectSlug(state.subject) ? state.subject : "english";
  const resultsHref = `/${subject}/results/${state.attemptId}`;
  if (state.status !== "in_progress") redirect(resultsHref);
  // English adaptive test with a Math test of the same month: a break, then Math (like the real SAT).
  const next = subject === "english" ? await nextSectionAfter(state.attemptId) : null;

  return (
    <TestRunner
      key={state.module.attemptModuleId}
      state={state}
      sectionName={SUBJECTS[subject].name}
      studentName={user.name}
      resultsHref={resultsHref}
      tools={SUBJECTS[subject].tools}
      sectionNumber={SUBJECTS[subject].sectionNumber}
      directions={SUBJECTS[subject].directions}
      directionExamples={SUBJECTS[subject].directionExamples}
      afterHref={next ? `/test/${state.attemptId}/break` : undefined}
      exitHref={`/${subject}/full-tests`}
    />
  );
}

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper text-[17px] text-graphite" role="status">
      Opening your test…
    </div>
  );
}
