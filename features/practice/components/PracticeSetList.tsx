import { Suspense } from "react";
import { EmptyState, Panel } from "@/core/design/ui";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { listPracticeSets, type PracticeSetRow } from "../queries";
import { monthLabel } from "../schema";
import { StartPracticeButton } from "./StartPracticeButton";

type Kind = "topic" | "monthly";

export function PracticeSetList({ subject, kind }: { subject: SubjectSlug; kind: Kind }) {
  return (
    <Suspense fallback={<div className="h-48 animate-pulse rounded-panel bg-paper" />}>
      <Sets subject={subject} kind={kind} />
    </Suspense>
  );
}

function Row({ set }: { set: PracticeSetRow }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
      <div className="min-w-0">
        <p className="font-bold">
          {set.title}
          {!set.published ? (
            <span className="ml-2.5 rounded-full bg-wash px-2.5 py-0.5 align-middle text-[13px] font-bold text-ink-soft">Draft, only you can see it</span>
          ) : null}
        </p>
        <p className="text-[15px] text-graphite">
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
  const sets = await listPracticeSets(subject, kind);
  if (sets.length === 0) {
    return (
      <EmptyState title={kind === "topic" ? "No topic sets yet" : "No monthly sets yet"}>
        {kind === "topic"
          ? `Practice sets for single ${SUBJECTS[subject].name} skills will appear here, grouped by area.`
          : "Each month’s questions will appear here, newest first."}
      </EmptyState>
    );
  }

  if (kind === "monthly") {
    const months = [...new Set(sets.map((s) => s.month ?? ""))].sort().reverse();
    return (
      <div className="flex flex-col gap-6">
        {months.map((month) => (
          <section key={month}>
            <h2 className="mb-3 text-xl font-extrabold tracking-tight">{month ? monthLabel(month) : "No month set"}</h2>
            <Panel className="p-0">
              <ul className="divide-y divide-hairline">
                {sets.filter((s) => (s.month ?? "") === month).map((s) => (
                  <Row key={s.id} set={s} />
                ))}
              </ul>
            </Panel>
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
          <h2 className="mb-3 text-xl font-extrabold tracking-tight">{area}</h2>
          <Panel className="p-0">
            <ul className="divide-y divide-hairline">
              {sets
                .filter((s) => (s.area ?? "Other") === area)
                .sort((a, b) => a.skillOrder - b.skillOrder)
                .map((s) => (
                  <Row key={s.id} set={s} />
                ))}
            </ul>
          </Panel>
        </section>
      ))}
    </div>
  );
}
