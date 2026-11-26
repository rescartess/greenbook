import Link from "next/link";
import { Suspense } from "react";
import { COLLECTION_LABEL, SQB_CREDIT, type Collection } from "@/core/config/practice";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { CardSkeleton, Empty, PageTitle, SegmentLinks } from "@/core/shell";
import { listTopics } from "../queries";
import type { TopicSummary } from "../schema";

const COLLECTIONS: Collection[] = ["books", "sqb"];

/** Topic practice. Two collections: GreenBook's own questions and College Board's SQB. */
export function TopicsPage({ subject, collection = "books" }: { subject: SubjectSlug; collection?: Collection }) {
  return (
    <TopicsFrame subject={subject} collection={collection}>
      <Suspense fallback={<CardSkeleton className="h-64" />}>
        <Topics subject={subject} collection={collection} />
      </Suspense>
    </TopicsFrame>
  );
}

async function Topics({ subject, collection }: { subject: SubjectSlug; collection: Collection }) {
  return <TopicGrid subject={subject} topics={await listTopics(subject, collection)} />;
}

export function TopicsFrame({ subject, collection, children }: { subject: SubjectSlug; collection: Collection; children: React.ReactNode }) {
  return (
    <>
      <PageTitle
        title="Topics"
        subtitle={
          collection === "sqb"
            ? `Official SAT questions for ${SUBJECTS[subject].name}, one question type at a time`
            : `${SUBJECTS[subject].name}, one question type at a time`
        }
      />
      <div className="mb-6">
        <SegmentLinks
          label="Question collection"
          options={COLLECTIONS.map((c) => ({
            label: COLLECTION_LABEL[c],
            href: c === "sqb" ? `/${subject}/topics/sqb` : `/${subject}/topics`,
            active: c === collection,
          }))}
        />
      </div>
      {children}
      {collection === "sqb" ? <p className="mt-8 max-w-2xl text-[13px] text-graphite">{SQB_CREDIT}</p> : null}
    </>
  );
}

export function TopicGrid({ subject, topics }: { subject: SubjectSlug; topics: TopicSummary[] }) {
  if (topics.length === 0) {
    return (
      <Empty title="No topics yet">
        Topic practice for {SUBJECTS[subject].name} will appear here once its questions are ready.
      </Empty>
    );
  }
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
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
  const share = ready ? Math.min(1, topic.done / topic.total) : 0;
  const body = (
    <>
      <h2 className="text-[18px] font-bold leading-snug">{topic.title}</h2>
      <p className="mt-1 text-[14px] text-graphite tabular-nums">
        {!topic.published ? "Hidden from students" : ready ? progress : "Questions coming soon"}
      </p>
      {ready ? (
        <>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-mist" aria-hidden="true">
            <div className="h-full rounded-full bg-pine" style={{ width: `${share * 100}%` }} />
          </div>
          <p className="mt-4 text-[15px] text-ink-soft tabular-nums">{topic.total} questions</p>
          <p className="mt-0.5 text-[14px] text-graphite tabular-nums">
            {topic.counts.easy} easy, {topic.counts.medium} medium, {topic.counts.hard} hard
          </p>
          <div className="mt-auto pt-5">
            <span
              className={
                topic.open > 0
                  ? "flex h-10 items-center justify-center rounded-[10px] border border-hairline bg-mist text-[15px] font-bold text-ink"
                  : "flex h-10 items-center justify-center rounded-[10px] bg-pine text-[15px] font-bold text-pine-ink"
              }
            >
              {topic.open > 0 ? "Continue" : "Start practice"}
            </span>
          </div>
        </>
      ) : null}
    </>
  );

  const box = "flex h-full flex-col rounded-[14px] border border-hairline bg-paper p-5";
  return ready ? (
    <Link
      href={`/${subject}/topics/${topic.id}`}
      className={`${box} transition-colors hover:border-graphite/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine`}
    >
      {body}
    </Link>
  ) : (
    <div className={`${box} opacity-70`}>{body}</div>
  );
}
