import Link from "next/link";
import { Suspense } from "react";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { EmptyState } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { listTopics } from "../queries";
import type { TopicSummary } from "../schema";

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
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-5">
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
  const progress =
    topic.open > 0 ? `${topic.open} unfinished` : topic.done > 0 ? `${topic.done} of ${topic.total} done` : "Not started";
  const body = (
    <>
      <h2 className="text-[21px] font-extrabold leading-tight tracking-tight">{topic.title}</h2>
      <p className="mt-1 text-[15px] text-graphite tabular-nums">
        {!topic.published ? "Hidden from students" : ready ? progress : "Questions coming soon"}
      </p>
      {ready ? (
        <>
          <p className="mt-4 text-[16px] text-ink-soft tabular-nums">{topic.total} questions</p>
          <p className="mt-1 text-[16px] text-ink-soft tabular-nums">
            {topic.counts.easy} easy, {topic.counts.medium} medium, {topic.counts.hard} hard
          </p>
          <div className="mt-auto pt-6">
            <span className="block rounded-lg bg-pine py-3 text-center text-[16px] font-bold text-pine-ink">
              {topic.open > 0 ? "Continue" : "Start practice"}
            </span>
          </div>
        </>
      ) : null}
    </>
  );

  const box = "flex h-full flex-col rounded-xl border-[1.5px] border-control bg-paper p-6";
  return ready ? (
    <Link
      href={`/${subject}/topics/${topic.id}`}
      className={`${box} transition-colors hover:border-pine focus-visible:outline-2 focus-visible:outline-pine`}
    >
      {body}
    </Link>
  ) : (
    <div className={`${box} opacity-70`}>{body}</div>
  );
}
