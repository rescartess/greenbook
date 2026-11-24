import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink, Panel } from "@/core/design/ui";
import { QuestionView, RichText } from "@/core/question";
import { requireAdmin } from "@/features/auth";
import { getQuestionPreview } from "../queries";
import { difficultyLabel, statusLabel } from "../schema";
import { LoadingBlock } from "./AdminShell";

export function AdminQuestionPage({ externalId }: { externalId: Promise<string> }) {
  return (
    <Suspense fallback={<LoadingBlock height={560} />}>
      <QuestionPreview externalId={externalId} />
    </Suspense>
  );
}

async function QuestionPreview({ externalId }: { externalId: Promise<string> }) {
  await requireAdmin();
  const q = await getQuestionPreview(await externalId);
  if (!q) notFound();
  const place = q.place;

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          {place ? (
            <Link
              href={`/admin/tests/${place.testId}`}
              className="text-[15px] font-semibold text-pine underline-offset-4 hover:underline"
            >
              {place.testTitle}
            </Link>
          ) : null}
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[38px] sm:leading-tight">
            {place ? `Question ${place.position} of ${place.total}` : q.externalId}
          </h1>
          {place ? <p className="mt-1 text-[17px] text-graphite">{place.moduleLabel}</p> : null}
        </div>
        {place ? (
          <nav className="flex gap-2" aria-label="Move between questions">
            {place.previousId ? (
              <ButtonLink href={`/admin/questions/${place.previousId}`} variant="quiet">
                Previous
              </ButtonLink>
            ) : null}
            {place.nextId ? <ButtonLink href={`/admin/questions/${place.nextId}`}>Next</ButtonLink> : null}
          </nav>
        ) : null}
      </header>

      <div className="overflow-hidden rounded-card border border-hairline bg-paper">
        <QuestionView number={place?.position ?? 1} question={q.content} correctId={q.correctId} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Panel>
          <h2 className="text-xl font-extrabold tracking-tight">
            {q.correctId ? `Answer: ${q.correctId}` : "No answer saved yet"}
          </h2>
          {q.explanation ? (
            <RichText source={q.explanation} className="mt-3 text-[17px] leading-relaxed text-ink-soft" />
          ) : (
            <p className="mt-3 text-graphite">No explanation yet.</p>
          )}
        </Panel>
        <Panel>
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 text-[15px]">
            <dt className="text-graphite">Topic</dt>
            <dd className="font-semibold">{q.skill}</dd>
            {q.domain ? (
              <>
                <dt className="text-graphite">Area</dt>
                <dd>{q.domain}</dd>
              </>
            ) : null}
            <dt className="text-graphite">Difficulty</dt>
            <dd>{difficultyLabel(q.difficulty)}</dd>
            <dt className="text-graphite">Status</dt>
            <dd>{statusLabel(q.status)}</dd>
            <dt className="text-graphite">Version</dt>
            <dd className="tabular-nums">{q.version}</dd>
            <dt className="text-graphite">ID</dt>
            <dd className="break-all text-ink-soft">{q.externalId}</dd>
          </dl>
        </Panel>
      </div>
    </>
  );
}
