import Link from "next/link";
import { Suspense } from "react";
import { ESTIMATED_SCORES, SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { BtnLink, Card, CardSkeleton, Empty, PageTitle } from "@/core/shell";
import { listResults, type ResultRow } from "../queries";
import { formatDate } from "../schema";

type Row = ResultRow;

export function ResultsPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageTitle title="Results" subtitle={`${SUBJECTS[subject].name} full tests, newest first`} />
      <Suspense fallback={<CardSkeleton />}>
        <ResultList subject={subject} />
      </Suspense>
    </>
  );
}

async function ResultList({ subject }: { subject: SubjectSlug }) {
  return <ResultRows subject={subject} rows={await listResults(subject)} />;
}

export function ResultRows({ subject, rows }: { subject: SubjectSlug; rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <Empty title="No results yet" action={<BtnLink href={`/${subject}/full-tests`}>See full tests</BtnLink>}>
        Finish a full test and your score and a question-by-question review will appear here.
      </Empty>
    );
  }
  return (
    <Card flush>
      <ul className="divide-y divide-hairline">
        {rows.map((r) => (
          <li key={r.attemptId}>
            <Link
              href={`/${subject}/results/${r.attemptId}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors first:rounded-t-[14px] last:rounded-b-[14px] hover:bg-mist sm:px-6"
            >
              <div className="min-w-0">
                <p className="truncate text-[16px] font-bold">{r.title}</p>
                <p className="mt-0.5 text-[14px] text-graphite">{formatDate(r.finishedAt)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[24px] font-bold leading-none tabular-nums">{r.score ?? r.raw}</p>
                <p className="mt-1 text-[12px] text-graphite">
                  {r.score ? (ESTIMATED_SCORES ? "Estimated score" : "Score") : "Correct answers"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
