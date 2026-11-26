import { Suspense } from "react";
import { Card, CardSkeleton, Empty, Note } from "@/core/shell";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { listPracticeSets, type PracticeSetRow } from "../queries";
import { monthLabel } from "../schema";
import { StartPracticeButton } from "./StartPracticeButton";

type Kind = "topic" | "monthly";

export function PracticeSetList({ subject, kind }: { subject: SubjectSlug; kind: Kind }) {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <Sets subject={subject} kind={kind} />
    </Suspense>
  );
}

function Row({ set }: { set: PracticeSetRow }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2.5 text-[16px] font-bold">
          {set.title}
          {!set.published ? <Note>Draft, only you can see it</Note> : null}
        </p>
        <p className="mt-0.5 text-[14px] text-graphite tabular-nums">
          {set.questions} question{set.questions === 1 ? "" : "s"}
          {set.last?.correct != null ? `. Last time: ${set.last.correct} of ${set.questions} right` : ""}
        </p>
      </div>
      {set.inProgressId ? (
        <StartPracticeButton setId={set.id} label="Continue" />
      ) : (
        <StartPracticeButton setId={set.id} label={set.last ? "Practice again" : "Start"} variant={set.last ? "quiet" : "primary"} />
      )}
    </li>
  );
}

async function Sets({ subject, kind }: { subject: SubjectSlug; kind: Kind }) {
  return <SetGroups subject={subject} kind={kind} sets={await listPracticeSets(subject, kind)} />;
}

/** Draws the sets grouped by month (or by area for topic sets). */
export function SetGroups({ subject, kind, sets }: { subject: SubjectSlug; kind: Kind; sets: PracticeSetRow[] }) {
  if (sets.length === 0) {
    return (
      <Empty title={kind === "topic" ? "No topic sets yet" : "No monthly sets yet"}>
        {kind === "topic"
          ? `Practice sets for single ${SUBJECTS[subject].name} skills will appear here, grouped by area.`
          : "Each month’s questions will appear here, newest first."}
      </Empty>
    );
  }

  if (kind === "monthly") {
    const months = [...new Set(sets.map((s) => s.month ?? ""))].sort().reverse();
    return (
      <div className="flex flex-col gap-6">
        {months.map((month) => (
          <section key={month}>
            <h2 className="mb-3 text-[17px] font-bold">{month ? monthLabel(month) : "No month set"}</h2>
            <Card flush>
              <ul className="divide-y divide-hairline">
                {sets.filter((s) => (s.month ?? "") === month).map((s) => (
                  <Row key={s.id} set={s} />
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>
    );
  }

  const areas = [...new Map(sets.map((s) => [s.area ?? "Other", s.areaOrder])).entries()].sort((a, b) => a[1] - b[1]).map(([a]) => a);
  return (
    <div className="flex flex-col gap-6">
      {areas.map((area) => (
        <section key={area}>
          <h2 className="mb-3 text-[17px] font-bold">{area}</h2>
          <Card flush>
            <ul className="divide-y divide-hairline">
              {sets
                .filter((s) => (s.area ?? "Other") === area)
                .sort((a, b) => a.skillOrder - b.skillOrder)
                .map((s) => (
                  <Row key={s.id} set={s} />
                ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}
