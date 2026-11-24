import Link from "next/link";
import { Suspense } from "react";
import { AccentPanel, ButtonLink, Panel, cn } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { getDashboard, type DashboardData } from "../queries";
import { getCurrentUser } from "@/features/auth";

function Trend({ values }: { values: number[] }) {
  const min = Math.min(...values) - 10;
  const max = Math.max(...values) + 10;
  const points = values
    .map((v, i) => `${6 + (i * 168) / (values.length - 1)},${58 - ((v - min) / (max - min)) * 52}`)
    .join(" ");
  return (
    <svg width="180" height="64" viewBox="0 0 180 64" role="img" aria-label={`Score trend over ${values.length} tests, from ${values[0]} to ${values[values.length - 1]}`}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** The dashboard frame shows at once; the student's own numbers stream in. */
export function DashboardPage({ subject }: { subject: SubjectSlug }) {
  return (
    <Suspense fallback={<DashboardLoading subject={subject} />}>
      <DashboardContent subject={subject} />
    </Suspense>
  );
}

function DashboardLoading({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="Welcome back" subtitle={SUBJECTS[subject].name} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[220px] rounded-panel border border-hairline bg-paper" />
        ))}
      </div>
    </>
  );
}

async function DashboardContent({ subject }: { subject: SubjectSlug }) {
  const [user, data] = await Promise.all([getCurrentUser(), getDashboard(subject)]);
  return <DashboardView subject={subject} data={data} firstName={user.name.split(" ")[0]} />;
}

function DashboardView({ subject, data, firstName }: { subject: SubjectSlug; data: DashboardData; firstName: string }) {
  const weakest = Math.min(...data.domains.map((d) => d.accuracy));
  return (
    <>
      <PageHeader title={`Welcome back, ${firstName}`} subtitle={SUBJECTS[subject].name} />
      <p className="-mt-3 mb-5 text-[13px] text-graphite">Sample numbers until your results are connected.</p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {data.resume ? (
          <AccentPanel className="flex min-h-[220px] flex-col justify-between gap-6">
            <div>
              <p className="text-[15px] font-semibold opacity-75">Continue where you left off</p>
              <h2 className="mt-2 text-[28px] font-extrabold tracking-tight">{data.resume.title}</h2>
              <p className="mt-1 text-base opacity-80">{data.resume.detail}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-pine-ink/20">
                <div className="h-1.5 rounded-full bg-pine-ink" style={{ width: `${Math.round(data.resume.progress * 100)}%` }} />
              </div>
              <Link href={data.resume.href} className="rounded-full bg-pine-ink px-6 py-3 text-base font-extrabold text-pine">
                Resume
              </Link>
            </div>
          </AccentPanel>
        ) : null}

        {data.score ? (
          <Panel className="flex min-h-[220px] flex-col gap-4">
            <p className="text-[15px] font-semibold text-graphite">Latest estimated score</p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[56px] font-extrabold leading-none tracking-tight">{data.score.value}</p>
                <p className="mt-2 text-[15px] font-bold text-pine">+{data.score.changeSinceFirst} since your first test</p>
              </div>
              <span className="text-pine">
                <Trend values={data.score.trend} />
              </span>
            </div>
            <p className="text-sm text-graphite">{data.score.detail}</p>
          </Panel>
        ) : null}

        <Panel className="flex flex-col gap-4">
          <h2 className="text-xl font-extrabold tracking-tight">Accuracy by area</h2>
          {data.domains.map((d) => (
            <div key={d.name} className="flex flex-col gap-2">
              <div className="flex justify-between gap-3 text-[15px]">
                <span className="font-semibold">{d.name}</span>
                <span className="font-bold tabular-nums">{d.accuracy}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-mist">
                <div
                  className={cn("h-2 rounded-full", d.accuracy === weakest ? "bg-pine-soft" : "bg-pine")}
                  style={{ width: `${d.accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </Panel>

        <Panel>
          <h2 className="mb-2 text-xl font-extrabold tracking-tight">Up next</h2>
          <ul>
            {data.next.map((item, i) => (
              <li
                key={item.title}
                className={cn("flex items-center justify-between gap-3 py-4", i < data.next.length - 1 && "border-b border-hairline")}
              >
                <div>
                  <p className="text-base font-bold">{item.title}</p>
                  <p className="mt-0.5 text-sm text-graphite">{item.detail}</p>
                </div>
                <ButtonLink href={item.href} size="sm" variant={item.primary ? "primary" : "quiet"}>
                  {item.primary ? "Start" : "Open"}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
