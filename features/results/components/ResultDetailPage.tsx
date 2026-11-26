import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ESTIMATED_SCORES, SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { cn } from "@/core/design/ui";
import { QuestionsOverview } from "@/core/question";
import { Card, CardSkeleton, PageTitle, ScoreScale } from "@/core/shell";
import { getCurrentUser } from "@/features/auth";
import { getResults } from "../queries";
import { accuracyByArea, formatDate, moduleLabel, type TestResults } from "../schema";
import { DeleteAttemptButton } from "./DeleteAttemptButton";

export function ResultDetailPage({ subject, attemptId }: { subject: SubjectSlug; attemptId: Promise<string> }) {
  return (
    <Suspense fallback={<CardSkeleton className="h-96" />}>
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

  const weakest = areas.filter((a) => a.total > 0).reduce<(typeof areas)[number] | null>(
    (w, a) => (!w || a.correct / a.total < w.correct / w.total ? a : w),
    null,
  );

  return (
    <>
      <PageTitle
        title={r.title}
        back={{ href: `/${subject}/results`, label: "All results" }}
        subtitle={`Section ${s.sectionNumber}, ${s.name}. ${formatDate(r.finishedAt)}`}
        aside={<DeleteAttemptButton attemptId={r.attemptId} subject={subject} />}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <p className="text-[14px] font-medium text-ink-soft">
            {s.name}, {estimated ? "estimated score" : r.scaledScore !== null ? "score" : "correct answers"}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[56px] font-bold leading-none tracking-[-0.02em] tabular-nums">{r.scaledScore ?? r.rawCorrect}</p>
            <p className="text-[15px] font-semibold text-ink-soft tabular-nums">
              {r.rawCorrect} of {total} correct
            </p>
          </div>
          {r.scaledScore !== null ? (
            <div className="mt-7">
              <ScoreScale value={r.scaledScore} />
            </div>
          ) : null}
          <ul className="mt-5 grid gap-1 text-[14px] text-ink-soft tabular-nums">
            {r.modules.map((m) => (
              <li key={m.number} className="flex justify-between gap-4 border-t border-hairline pt-2 first:border-t-0 first:pt-0">
                <span>{moduleLabel(m)}</span>
                <span className="font-semibold text-ink">
                  {m.correct} of {m.total}
                </span>
              </li>
            ))}
          </ul>
          {estimated ? (
            <p className="mt-4 text-[13px] text-graphite">Estimated from your answers. The real SAT curve changes from test to test.</p>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-[17px] font-bold">By area</h2>
          <ul className="mt-4 grid gap-4">
            {areas.map((a) => {
              const share = a.total ? a.correct / a.total : 0;
              const isWeakest = weakest?.area === a.area && areas.length > 1;
              return (
                <li key={a.area}>
                  <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-[15px] font-semibold">
                      {a.area}
                      {isWeakest ? <span className="ml-2 text-[13px] font-semibold text-pine">Weakest</span> : null}
                    </span>
                    <span className="text-[14px] text-ink-soft tabular-nums">
                      {a.correct} of {a.total}
                    </span>
                  </p>
                  {s.domainNotes[a.area] ? <p className="text-[13px] text-graphite">{s.domainNotes[a.area]}</p> : null}
                  <div className="mt-2 h-1.5 overflow-hidden rounded-[3px] bg-mist" role="img" aria-label={`${a.correct} of ${a.total} correct`}>
                    <div className={cn("h-full rounded-[3px]", isWeakest ? "bg-pine" : "bg-graphite/45")} style={{ width: `${share * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <QuestionsOverview
        title={r.title}
        studentName={studentName}
        subtitle="Review your results for each question from this practice test."
        items={r.modules.flatMap((m) =>
          m.questions.map((q) => ({
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
            section: s.name,
            domain: q.domain || null,
          })),
        )}
      />
    </>
  );
}
