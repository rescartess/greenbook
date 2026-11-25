import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ESTIMATED_SCORES, SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { Panel, cn } from "@/core/design/ui";
import { getCurrentUser } from "@/features/auth";
import { getResults } from "../queries";
import { accuracyByArea, filledSegments, formatDate, moduleLabel, type TestResults } from "../schema";
import { AnswerReview } from "./AnswerReview";
import { DeleteAttemptButton } from "./DeleteAttemptButton";
import { ScoreGauge } from "./ScoreGauge";

const SEGMENTS = 7;

export function ResultDetailPage({ subject, attemptId }: { subject: SubjectSlug; attemptId: Promise<string> }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-panel bg-paper" />}>
      <Detail subject={subject} attemptId={attemptId} />
    </Suspense>
  );
}

async function Detail({ subject, attemptId }: { subject: SubjectSlug; attemptId: Promise<string> }) {
  const [user, r] = await Promise.all([getCurrentUser(), getResults(await attemptId)]);
  if (!r || r.subject !== subject) notFound();
  return <ResultsView r={r} subject={subject} studentName={user.name} />;
}

/** The results page for one finished test (draws only; the data is loaded above). */
export function ResultsView({ r, subject, studentName }: { r: TestResults; subject: SubjectSlug; studentName: string }) {
  const s = SUBJECTS[subject];
  const total = r.modules.reduce((sum, m) => sum + m.total, 0);
  const areas = accuracyByArea(r, s.domains);
  const estimated = r.scaledScore !== null && ESTIMATED_SCORES;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 pt-1 sm:pt-3">
        <div>
          <Link href={`/${subject}/results`} className="text-[15px] font-semibold text-pine underline-offset-4 hover:underline">
            All results
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[40px] sm:leading-tight">{r.title}</h1>
          <p className="mt-1 text-[17px] text-graphite">
            Section {s.sectionNumber}, {s.name}. {formatDate(r.finishedAt)}
          </p>
        </div>
        <DeleteAttemptButton attemptId={r.attemptId} subject={subject} />
      </header>

      <h2 className="mb-3 text-xl font-extrabold tracking-tight">Score</h2>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <Panel className="flex flex-col items-center text-center">
          <p className="mb-3 font-bold">{s.name}</p>
          <ScoreGauge score={r.scaledScore} />
          <p className="mt-4 text-[17px] text-ink-soft tabular-nums">
            {r.rawCorrect} of {total} correct
          </p>
          <ul className="mt-3 flex flex-col gap-1 text-[14px] text-graphite tabular-nums">
            {r.modules.map((m) => (
              <li key={m.number}>
                {moduleLabel(m)}: {m.correct} of {m.total}
              </li>
            ))}
          </ul>
          {estimated ? (
            <p className="mt-4 text-[13px] text-graphite">Estimated. The real SAT curve changes from test to test.</p>
          ) : null}
        </Panel>

        <Panel className="flex flex-col gap-5">
          <h3 className="text-lg font-extrabold tracking-tight">Breakdown</h3>
          {areas.map((a) => {
            const filled = filledSegments(a.correct, a.total, SEGMENTS);
            return (
              <div key={a.area} className="border-b border-hairline pb-4 last:border-b-0 last:pb-0">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-bold">{a.area}</span>
                  <span className="text-[14px] font-semibold text-ink-soft tabular-nums">
                    {a.correct} of {a.total} correct
                  </span>
                </p>
                {s.domainNotes[a.area] ? <p className="text-[14px] text-graphite">{s.domainNotes[a.area]}</p> : null}
                <div
                  className="mt-2.5 grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${SEGMENTS}, minmax(0, 1fr))` }}
                  role="img"
                  aria-label={`${a.correct} of ${a.total} correct`}
                >
                  {Array.from({ length: SEGMENTS }, (_, i) => (
                    <span key={i} className={cn("h-2 rounded-full", i < filled ? "bg-pine" : "bg-hairline")} />
                  ))}
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      <AnswerReview
        title={r.title}
        studentName={studentName}
        groups={r.modules.map((m) => ({
          label: `Section ${s.sectionNumber}, ${moduleLabel(m)}: ${s.name}`,
          items: m.questions.map((q) => ({
            id: q.id,
            number: q.position,
            group: moduleLabel(m),
            type: q.type,
            passage: q.passage,
            image: q.image,
            prompt: q.prompt,
            choices: q.choices,
            answer: q.answer,
            correctAnswer: q.correctAnswer,
            isCorrect: q.isCorrect,
            marked: q.marked,
            explanation: q.explanation,
          })),
        }))}
      />
    </>
  );
}
