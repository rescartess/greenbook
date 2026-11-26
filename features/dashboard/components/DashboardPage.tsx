import { Suspense } from "react";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { cn } from "@/core/design/ui";
import { BtnLink, Bubbles, Card, PageTitle } from "@/core/shell";
import { ColorSettings, getLook } from "@/features/profile";
import { getDashboard, type DashboardData } from "../queries";
import { pickRoast } from "../roasts";
import { RoastCard } from "./RoastCard";

/** An SAT section is scored from 200 to 800 (English and Math alike). */
const SCALE_MIN = 200;
const SCALE_MAX = 800;
/** Up to this many questions, progress is drawn as answer bubbles; above it, as a thin bar. */
const MAX_BUBBLES = 40;

/** The dashboard frame shows at once; the student's own numbers stream in. */
export function DashboardPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageTitle title="Dashboard" subtitle={SUBJECTS[subject].name} />
      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent subject={subject} />
      </Suspense>
    </>
  );
}

function DashboardLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[248px] rounded-[14px] border border-hairline bg-paper" />
      ))}
    </div>
  );
}

async function DashboardContent({ subject }: { subject: SubjectSlug }) {
  const [data, look] = await Promise.all([getDashboard(subject), getLook()]);
  return <DashboardView subject={subject} data={data} roast={pickRoast()} design={<ColorSettings initial={look.colors} compact />} />;
}

export function DashboardView({
  data,
  roast,
  design,
}: {
  subject: SubjectSlug;
  data: DashboardData;
  roast: string;
  design?: React.ReactNode;
}) {
  const measured = data.domains.filter((d) => d.accuracy !== null).map((d) => d.accuracy!);
  const weakest = measured.length > 1 ? Math.min(...measured) : null;
  const firstTime = !data.resume && !data.score && measured.length === 0;
  const both = Boolean(data.resume && data.score);
  return (
    <>
      {firstTime ? (
        <p className="-mt-3 mb-6 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Start with a full test or a short topic set. Your score, accuracy and mistakes will show up here as you go.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        {data.score ? <ScoreCard score={data.score} className={both ? undefined : "lg:col-span-2"} /> : null}
        {data.resume ? <ContinueCard resume={data.resume} className={both ? undefined : "lg:col-span-2"} /> : null}

        <Card>
          <h2 className="text-[17px] font-bold">Accuracy by area</h2>
          <ul className="mt-3">
            {data.domains.map((d) => {
              const weak = d.accuracy !== null && d.accuracy === weakest;
              return (
                <li key={d.name} className="border-t border-hairline py-2.5 first:border-t-0">
                  <div className="flex items-baseline justify-between gap-3 text-[15px]">
                    <span className="font-medium">
                      {d.name}
                      {weak ? <span className="ml-2 text-[12px] font-semibold text-pine">Weakest</span> : null}
                    </span>
                    <span className={cn("tabular-nums", d.accuracy === null ? "text-graphite" : "font-semibold")}>
                      {d.accuracy === null ? "Not yet" : `${d.accuracy}%`}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-[3px] bg-mist">
                    <div
                      className={cn("h-full rounded-[3px]", weak ? "bg-pine" : "bg-graphite/50")}
                      style={{ width: `${Math.max(d.accuracy ?? 0, d.accuracy === null ? 0 : 1)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <RoastCard first={roast} />

        {design ? (
          <Card className="lg:col-span-2">
            <h2 className="text-[17px] font-bold">Design color</h2>
            {design}
          </Card>
        ) : null}
      </div>
    </>
  );
}

const at = (score: number) => `${((Math.min(Math.max(score, SCALE_MIN), SCALE_MAX) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100}%`;

/** The one rich moment: the latest score on the 200 to 800 section scale, next to where the student started. */
function ScoreCard({ score, className }: { score: NonNullable<DashboardData["score"]>; className?: string }) {
  const change = score.changeSinceFirst;
  const ticks = Array.from({ length: (SCALE_MAX - SCALE_MIN) / 100 + 1 }, (_, i) => SCALE_MIN + i * 100);
  return (
    <Card className={className}>
      <p className="text-[14px] font-medium text-ink-soft">Latest {score.estimated ? "estimated " : ""}score</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-[56px] font-bold leading-none tracking-[-0.02em] tabular-nums">{score.value}</p>
        <p className="text-[15px] font-semibold text-pine tabular-nums">
          {change === null ? "Your first full test" : `${change >= 0 ? "+" : "−"}${Math.abs(change)} vs your first test`}
        </p>
      </div>

      <div className="mt-7" role="img" aria-label={`${score.value} on a scale from ${SCALE_MIN} to ${SCALE_MAX}${score.first !== null ? `, up from ${score.first}` : ""}`}>
        <div className="relative h-2.5 rounded-[5px] bg-mist ring-1 ring-hairline ring-inset">
          <div className="absolute inset-y-0 left-0 rounded-[5px] bg-pine" style={{ width: at(score.value) }} />
          {score.first !== null ? (
            <span className="absolute -top-1.5 h-[22px] w-0.5 -translate-x-1/2 rounded-[1px] bg-graphite/70" style={{ left: at(score.first) }} />
          ) : null}
          <span className="absolute -top-1.5 h-[22px] w-0.5 -translate-x-1/2 rounded-[1px] bg-ink" style={{ left: at(score.value) }} />
        </div>
        <div className="mt-2.5 flex justify-between text-[12px] text-graphite tabular-nums">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-soft tabular-nums">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-2.5 bg-ink" aria-hidden="true" />
          {score.latest}: {score.value}
        </span>
        {score.first !== null ? (
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-0.5 w-2.5 bg-graphite/70" aria-hidden="true" />
            First test: {score.first}
          </span>
        ) : null}
      </div>
      {score.estimated ? <p className="mt-4 text-[13px] text-graphite">Estimated from your answers, not an official score</p> : null}
    </Card>
  );
}

function ContinueCard({ resume, className }: { resume: NonNullable<DashboardData["resume"]>; className?: string }) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <p className="text-[14px] font-medium text-ink-soft">Continue where you left off</p>
      <h2 className="mt-1.5 text-[24px] font-bold leading-tight">{resume.title}</h2>
      <p className="mt-1 text-[15px] text-ink-soft tabular-nums">{resume.detail}</p>
      <div className="mb-5 mt-5">
        {resume.total > 0 && resume.total <= MAX_BUBBLES ? (
          <Bubbles done={resume.done} total={resume.total} label={resume.detail} />
        ) : (
          <div className="h-1.5 overflow-hidden rounded-[3px] bg-mist">
            <div className="h-full rounded-[3px] bg-pine" style={{ width: `${Math.round(resume.progress * 100)}%` }} />
          </div>
        )}
      </div>
      <div className="mt-auto">
        <BtnLink href={resume.href}>Resume</BtnLink>
      </div>
    </Card>
  );
}
