import Link from "next/link";
import { Suspense } from "react";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { EmptyState } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { listTopics } from "../queries";
import type { TopicSummary } from "../schema";
import { LevelBar } from "./LevelBar";

export function TopicsPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="Topics" subtitle={SUBJECTS[subject].name} />
      <p className="-mt-2 mb-7 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
        Practice one question type at a time. Pick a level and how many questions, then check as you go or at the end.
      </p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-panel bg-paper" />}>
        <Topics subject={subject} />
      </Suspense>
    </>
  );
}

async function Topics({ subject }: { subject: SubjectSlug }) {
  const topics = await listTopics(subject);
  if (topics.length === 0) {
    return (
      <EmptyState title="No topics yet">
        Topic practice for {SUBJECTS[subject].name} will appear here once its questions are ready.
      </EmptyState>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {topics.map((t) => (
        <li key={t.id}>
          <TopicCard subject={subject} topic={t} />
        </li>
      ))}
    </ul>
  );
}

function TopicCard({ subject, topic }: { subject: SubjectSlug; topic: TopicSummary }) {
  const ready = topic.total > 0;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[19px] font-extrabold leading-snug tracking-tight">{topic.title}</h2>
        {!topic.published ? (
          <span className="shrink-0 rounded-full bg-wash px-2.5 py-0.5 text-[12px] font-bold text-ink-soft">
            Hidden from students
          </span>
        ) : null}
      </div>
      {topic.description ? <p className="mt-1 text-[15px] leading-snug text-graphite">{topic.description}</p> : null}

      {ready ? (
        <>
          <LevelBar counts={topic.counts} className="mt-5" />
          <p className="mt-2 text-[13px] text-graphite tabular-nums">
            {topic.counts.easy} easy, {topic.counts.medium} medium, {topic.counts.hard} hard
          </p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <p className="text-[14px] text-ink-soft tabular-nums">
              {topic.open > 0
                ? `${topic.open} unfinished`
                : topic.done > 0
                  ? `${topic.done} of ${topic.total} done`
                  : `${topic.total} questions`}
            </p>
            <span className="rounded-full bg-pine px-4 py-2 text-sm font-bold text-pine-ink">
              {topic.open > 0 ? "Continue" : "Choose questions"}
            </span>
          </div>
        </>
      ) : (
        <p className="mt-auto pt-5 text-[14px] text-graphite">Questions coming soon</p>
      )}
    </>
  );

  const box = "flex h-full flex-col rounded-panel border border-hairline bg-paper p-6";
  return ready ? (
    <Link
      href={`/${subject}/topics/${topic.id}`}
      className={`${box} transition-colors hover:border-pine-soft focus-visible:outline-2 focus-visible:outline-pine`}
    >
      {body}
    </Link>
  ) : (
    <div className={`${box} opacity-70`}>{body}</div>
  );
}
