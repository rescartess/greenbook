import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ESTIMATED_SCORES, SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { cn } from "@/core/design/ui";
import { QuestionsOverview } from "@/core/question";
import { Card, CardSkeleton, PageTitle, ScoreScale } from "@/core/shell";
import { getCurrentUser } from "@/features/auth";
import { getResults } from "../queries";
import { accuracyByArea, filledSegments, formatDate, moduleLabel, practiceLevel, type TestResults } from "../schema";
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


  return (
    <>
      <PageTitle
        title={r.title}
        back={{ href: `/${subject}/results`, label: "All results" }}
        subtitle={`Section ${s.sectionNumber}, ${s.name}`}
        aside={<DeleteAttemptButton attemptId={r.attemptId} subject={subject} />}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="score-title" className="overflow-hidden rounded-[14px] border border-hairline bg-paper">
          <div className="bg-pine-soft px-6 py-5">
            <h2 id="score-title" className="text-[22px] font-bold leading-tight">{r.title}</h2>
            <p className="mt-1 text-[15px] text-ink-soft">{formatDate(r.finishedAt)}</p>
          </div>
          <div className="px-6 pb-6 pt-5">
            <p className="text-[15px] font-bold">
              {s.name}
              {estimated ? <span className="font-medium text-graphite">, estimated</span> : null}
            </p>
            <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1">
              <p className="text-[64px] font-bold leading-none tracking-[-0.02em] tabular-nums">{r.scaledScore ?? r.rawCorrect}</p>
              <p className="pb-1.5 text-[15px] text-ink-soft tabular-nums">
                {r.scaledScore !== null ? "200–800. " : ""}
                {r.rawCorrect} of {total} correct
              </p>
            </div>
            {r.scaledScore !== null ? (
              <div className="mt-6">
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
              <p className="mt-4 text-[13px] text-graphite">Estimated from which questions you got right and how hard they were. The real SAT curve changes from test to test.</p>
            ) : null}
          </div>
        </section>

        <Card>
          <h2 className="text-[20px] font-bold">Knowledge and Skills</h2>
          <p className="text-[14px] text-graphite">Your results in the 4 content areas of this section</p>
          <ul className="mt-5 grid gap-5">
            {areas.map((a) => {
              const filled = filledSegments(a.correct, a.total);
              const level = practiceLevel(a.correct, a.total);
              return (
                <li key={a.area}>
                  <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-[15px] font-bold">{a.area}</span>
                    <span className="text-[14px] text-ink-soft tabular-nums">
                      {a.correct} of {a.total}
                    </span>
                  </p>
                  {s.domainShares[a.area] ? <p className="text-[13px] text-graphite">({s.domainShares[a.area]})</p> : null}
                  <div className="mt-2 grid grid-cols-7 gap-1" role="img" aria-label={`${filled} of 7 blocks: ${a.correct} of ${a.total} correct`}>
                    {Array.from({ length: 7 }, (_, i) => (
                      <span key={i} className={cn("h-2 rounded-[2px]", i < filled ? "bg-pine" : "bg-mist ring-1 ring-inset ring-hairline")} />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[13px] text-ink-soft">
                    Practice level:{" "}
                    <Link href={`/${subject}/topics`} className="font-semibold text-pine underline decoration-dotted underline-offset-4">
                      {level}
                    </Link>
                  </p>
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
