import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { AccentPanel, Panel, cn } from "@/core/design/ui";
import { ESTIMATED_SCORES, SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { QuestionView, RichText } from "@/core/question";
import { getResults } from "../queries";
import { accuracyByArea, formatDate, type ResultQuestion } from "../schema";

export function ResultDetailPage({ subject, attemptId }: { subject: SubjectSlug; attemptId: Promise<string> }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-panel bg-paper" />}>
      <Detail subject={subject} attemptId={attemptId} />
    </Suspense>
  );
}

function status(q: ResultQuestion) {
  if (q.isCorrect) return "Correct";
  return q.answer ? "Wrong" : "Unanswered";
}

async function Detail({ subject, attemptId }: { subject: SubjectSlug; attemptId: Promise<string> }) {
  const r = await getResults(await attemptId);
  if (!r || r.subject !== subject) notFound();
  const total = r.modules.reduce((s, m) => s + m.total, 0);
  const areas = accuracyByArea(r, SUBJECTS[subject].domains);
  const wrong = r.modules.flatMap((m) => m.questions).filter((q) => !q.isCorrect).length;

  return (
    <>
      <header className="mb-6 pt-1 sm:pt-3">
        <Link href={`/${subject}/results`} className="text-[15px] font-semibold text-pine underline-offset-4 hover:underline">
          All results
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-[40px] sm:leading-tight">{r.title}</h1>
        <p className="mt-1 text-[17px] text-graphite">
          {SUBJECTS[subject].name}, {formatDate(r.finishedAt)}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <AccentPanel className="flex flex-col justify-between gap-6">
          <div>
            <p className="text-[15px] font-semibold opacity-80">{r.scaledScore && ESTIMATED_SCORES ? "Estimated score" : "Score"}</p>
            <p className="mt-2 text-[64px] font-extrabold leading-none tracking-tight tabular-nums">{r.scaledScore ?? "–"}</p>
            <p className="mt-3 text-[17px] opacity-90">
              {r.rawCorrect} of {total} correct
            </p>
          </div>
          <div className="flex flex-col gap-1.5 text-[15px] opacity-90">
            {r.modules.map((m) => (
              <p key={m.number}>
                Module {m.number}
                {m.number === 2 && m.tier !== "standard" ? ` (${m.tier})` : ""}: {m.correct} of {m.total}
              </p>
            ))}
          </div>
          {r.scaledScore && ESTIMATED_SCORES ? (
            <p className="text-[13px] opacity-75">Estimated from your correct answers; the real SAT curve changes from test to test.</p>
          ) : null}
        </AccentPanel>

        <Panel className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold tracking-tight">Accuracy by area</h2>
          {areas.map((a) => (
            <div key={a.area} className="flex flex-col gap-2">
              <div className="flex justify-between gap-3 text-[15px]">
                <span className="font-semibold">{a.area}</span>
                <span className="font-bold tabular-nums">
                  {a.correct} of {a.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-mist">
                <div className="h-2 rounded-full bg-pine" style={{ width: `${a.percent ?? 0}%` }} />
              </div>
            </div>
          ))}
        </Panel>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-extrabold tracking-tight">Review every question</h2>
        <p className="mt-1 text-[15px] text-graphite">
          {wrong === 0 ? "Every answer was right." : `${wrong} to look at again. Open a question to see the explanation.`}
        </p>
        {r.modules.map((m) => (
          <Panel key={m.number} className="mt-5 p-0">
            <h3 className="px-6 pb-3 pt-5 text-lg font-extrabold">Module {m.number}</h3>
            <ol className="divide-y divide-hairline border-t border-hairline">
              {m.questions.map((q) => (
                <li key={q.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-3.5 hover:bg-mist [&::-webkit-details-marker]:hidden">
                      <span className="w-7 font-bold tabular-nums text-graphite">{q.position}</span>
                      <span
                        className={cn(
                          "w-28 shrink-0 text-sm font-bold",
                          q.isCorrect ? "text-pine" : q.answer ? "text-ink" : "text-graphite",
                        )}
                      >
                        {status(q)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] text-ink-soft">{q.skill}</span>
                      <span className="hidden text-sm tabular-nums text-graphite sm:block">
                        {q.answer ? `You: ${q.answer}` : "No answer"}, right: {q.correctAnswer ?? "?"}
                      </span>
                    </summary>
                    <div className="border-t border-hairline bg-mist px-3 pb-5 pt-3 sm:px-5">
                      <div className="overflow-hidden rounded-card border border-hairline bg-paper">
                        <QuestionView number={q.position} question={q} selectedId={q.answer} correctId={q.correctAnswer} />
                      </div>
                      {q.explanation ? (
                        <div className="mt-3 rounded-panel border border-hairline bg-paper px-6 py-5">
                          <p className="text-[15px] font-bold">Explanation</p>
                          <RichText source={q.explanation} className="mt-1.5 text-[15px] leading-relaxed text-ink-soft" />
                        </div>
                      ) : null}
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          </Panel>
        ))}
      </section>
    </>
  );
}
