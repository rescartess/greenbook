import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SUBJECTS, isSubjectSlug } from "@/core/config/subjects";
import { cn } from "@/core/design/ui";
import { BtnLink, Card } from "@/core/shell";
import { requireAdmin } from "@/features/auth";
import { SIGN_IN_LABEL, agoLabel, dateLabel, dateTimeLabel, percent, timeLabel } from "../student-format";
import { getStudent, type StudentAttempt, type StudentDetail } from "../students";
import { AdminTitle, LoadingBlock } from "./AdminShell";
import { StatTile, StudentAvatar, Tag } from "./StudentAvatar";

/** /admin/students/[id]: everything about one student, top to bottom. */
export function StudentDetailPage({ id }: { id: Promise<string> }) {
  return (
    <Suspense fallback={<LoadingBlock height={640} />}>
      <Detail id={id} />
    </Suspense>
  );
}

const subjectName = (s: string) => (isSubjectSlug(s) ? SUBJECTS[s].name : s);

async function Detail({ id }: { id: Promise<string> }) {
  await requireAdmin();
  const s = await getStudent(await id);
  if (!s) notFound();

  return (
    <>
      <AdminTitle back={{ href: "/admin/students", label: "All students" }} title={s.name} />

      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <StudentAvatar url={s.avatarUrl} name={s.name} size={84} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <a href={`mailto:${s.email}`} className="truncate text-[16px] font-semibold text-pine underline-offset-4 hover:underline">
                {s.email}
              </a>
              {s.admin ? <Tag strong>Admin</Tag> : null}
              <Tag>{SIGN_IN_LABEL[s.via]}</Tag>
            </div>
            <p className="mt-2 text-[15px] text-ink-soft">{s.bio ? `“${s.bio}”` : <span className="text-graphite">No bio</span>}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[14px] sm:grid-cols-4">
              <Fact label="Joined" value={dateLabel(s.joined)} />
              <Fact label="Last active" value={agoLabel(s.lastActive)} />
              <Fact label="Target score" value={s.targetScore ? String(s.targetScore) : "Not set"} />
              <Fact label="SAT date" value={s.testDate ? dateLabel(s.testDate) : "Not set"} />
            </dl>
          </div>
          {!s.admin ? (
            <BtnLink href={`/english/students/${s.id}`} tone="quiet" className="shrink-0">
              Public profile
            </BtnLink>
          ) : null}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Time practicing" value={timeLabel(s.seconds)} note={s.rank ? `#${s.rank} of ${s.students} students` : undefined} />
        <StatTile label="Questions answered" value={s.answered.toLocaleString("en-US")} note={`${s.correct} right`} />
        <StatTile label="Accuracy" value={percent(s.correct, s.answered)} note="Right answers out of all answered" />
        <StatTile label="Tests and practices" value={String(s.finished)} note={`finished, ${s.started - s.finished} not finished`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {s.subjects.map((x) => (
          <Card key={x.subject}>
            <h2 className="text-[17px] font-bold">{subjectName(x.subject)}</h2>
            <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-4 text-[14px]">
              <Fact label="Time" value={timeLabel(x.seconds)} big />
              <Fact label="Answered" value={String(x.answered)} big />
              <Fact label="Accuracy" value={percent(x.correct, x.answered)} big />
              <Fact label="Best full test" value={x.best ? String(x.best) : "–"} big />
              <Fact label="Latest full test" value={x.latest ? String(x.latest) : "–"} big />
              <Fact label="Full tests done" value={String(x.fullTests)} big />
            </dl>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Days days={s.days} />
        <Topics skills={s.skills} />
      </div>

      <Recent attempts={s.attempts} />
    </>
  );
}

function Fact({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <dt className="text-[13px] text-graphite">{label}</dt>
      <dd className={cn("font-semibold tabular-nums", big && "text-[20px] font-extrabold tracking-[-0.01em]")}>{value}</dd>
    </div>
  );
}

/** The last 30 days as bars: taller bar, more time that day. */
function Days({ days }: { days: StudentDetail["days"] }) {
  const max = Math.max(...days.map((d) => d.seconds), 1);
  const total = days.reduce((sum, d) => sum + d.seconds, 0);
  const active = days.filter((d) => d.seconds > 0).length;
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-bold">Last 30 days</h2>
        <p className="text-[13px] text-graphite tabular-nums">
          {timeLabel(total)} on {active} {active === 1 ? "day" : "days"}
        </p>
      </div>
      <div className="mt-5 flex h-[120px] items-end gap-[3px]" role="img" aria-label={`Practiced on ${active} of the last 30 days`}>
        {days.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end">
            <div
              className={cn("w-full rounded-t-[3px]", d.seconds ? "bg-pine" : "bg-mist")}
              style={{ height: d.seconds ? `${Math.max(6, (d.seconds / max) * 100)}%` : "4px" }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[12px] text-paper group-hover:block">
              {dateLabel(d.day)}: {timeLabel(d.seconds)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-graphite">
        <span>{dateLabel(days[0]!.day)}</span>
        <span>Today</span>
      </div>
    </Card>
  );
}

/** Topics with at least 3 answers, weakest first. */
function Topics({ skills }: { skills: StudentDetail["skills"] }) {
  return (
    <Card>
      <h2 className="text-[17px] font-bold">Topics, weakest first</h2>
      {skills.length === 0 ? (
        <p className="mt-3 text-[15px] text-graphite">Not enough answers yet. Shows after 3 answers in a topic.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {skills.slice(0, 8).map((k) => (
            <li key={`${k.subject}-${k.skill}`}>
              <div className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="truncate font-semibold">{k.skill}</span>
                <span className="shrink-0 tabular-nums text-graphite">
                  {k.correct}/{k.answered} · <span className="font-bold text-ink">{percent(k.correct, k.answered)}</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist">
                <div className="h-full rounded-full bg-pine" style={{ width: `${Math.round(k.accuracy * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const KIND: Record<StudentAttempt["kind"], string> = { full: "Full test", topic: "Topic practice", monthly: "Monthly set", mistakes: "Mistakes review" };
const STATUS: Record<StudentAttempt["status"], string> = { completed: "Finished", in_progress: "Not finished", abandoned: "Left" };

/** Recent tests and practices, newest first. */
function Recent({ attempts }: { attempts: StudentAttempt[] }) {
  return (
    <Card flush className="mt-4">
      <h2 className="px-5 pt-5 text-[17px] font-bold sm:px-6">Recent tests and practices</h2>
      {attempts.length === 0 ? (
        <p className="px-6 pb-6 pt-3 text-[15px] text-graphite">Nothing yet.</p>
      ) : (
        <ul className="mt-3">
          {attempts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-hairline px-5 py-3 sm:px-6">
              <div className="min-w-0 flex-1 basis-[220px]">
                <p className="truncate font-semibold">{a.title}</p>
                <p className="text-[13px] text-graphite">
                  {KIND[a.kind]} · {subjectName(a.subject)} · {dateTimeLabel(a.started)}
                </p>
              </div>
              <span className="w-[72px] text-[14px] tabular-nums text-graphite">{timeLabel(a.seconds)}</span>
              <span className="w-[120px] text-[14px] tabular-nums">
                {a.score ? (
                  <span className="font-extrabold">{a.score}</span>
                ) : (
                  <>
                    {a.correct}/{a.total} right
                  </>
                )}
                {a.answered ? <span className="text-graphite"> · {percent(a.correct, a.answered)}</span> : null}
              </span>
              <Tag strong={a.status === "completed"}>{STATUS[a.status]}</Tag>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
