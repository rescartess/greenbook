import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink, EmptyState, Panel } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { ESTIMATED_SCORES, SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { listResults } from "../queries";
import { formatDate } from "../schema";

export function ResultsPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="Results" subtitle={SUBJECTS[subject].name} />
      <Suspense fallback={<div className="h-48 animate-pulse rounded-panel bg-paper" />}>
        <ResultList subject={subject} />
      </Suspense>
    </>
  );
}

async function ResultList({ subject }: { subject: SubjectSlug }) {
  const rows = await listResults(subject);
  if (rows.length === 0) {
    return (
      <EmptyState title="No results yet">
        Finish a full test and your score and a question-by-question review will appear here.
        <span className="mt-4 block">
          <ButtonLink href={`/${subject}/full-tests`}>See full tests</ButtonLink>
        </span>
      </EmptyState>
    );
  }
  return (
    <Panel className="p-0">
      <ul className="divide-y divide-hairline">
        {rows.map((r) => (
          <li key={r.attemptId}>
            <Link href={`/${subject}/results/${r.attemptId}`} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 hover:bg-mist">
              <div>
                <p className="text-lg font-bold">{r.title}</p>
                <p className="text-[15px] text-graphite">{formatDate(r.finishedAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-[28px] font-extrabold leading-none tracking-tight tabular-nums">{r.score ?? r.raw}</p>
                <p className="mt-1 text-[13px] text-graphite">
                  {r.score ? (ESTIMATED_SCORES ? "Estimated score" : "Score") : "Correct answers"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
