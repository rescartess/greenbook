import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SQB_CREDIT } from "@/core/config/practice";
import { CardSkeleton, PageTitle } from "@/core/shell";
import type { SubjectSlug } from "@/core/config/subjects";
import { startTopicPractice } from "@/features/practice";
import { getTopic } from "../queries";
import type { TopicDetail } from "../schema";
import { TopicSetup } from "./TopicSetup";

/** One topic: choose level, range, checking and timer, then start. */
export function TopicPage({ subject, setId }: { subject: SubjectSlug; setId: Promise<string> }) {
  return (
    <Suspense fallback={<CardSkeleton className="h-96" />}>
      <Topic subject={subject} setId={setId} />
    </Suspense>
  );
}

async function Topic({ subject, setId }: { subject: SubjectSlug; setId: Promise<string> }) {
  const topic = await getTopic(await setId);
  if (!topic || topic.subject !== subject) notFound();
  return <TopicView subject={subject} topic={topic} startAction={startTopicPractice} />;
}

export function TopicView({
  subject,
  topic,
  startAction,
}: {
  subject: SubjectSlug;
  topic: TopicDetail;
  startAction: Parameters<typeof TopicSetup>[0]["startAction"];
}) {
  return (
    <>
      <PageTitle
        title={topic.title}
        back={topic.collection === "sqb" ? { href: `/${subject}/topics/sqb`, label: "SQB topics" } : { href: `/${subject}/topics`, label: "Topics" }}
        subtitle={`${topic.description ? `${topic.description} ` : ""}${topic.items.length} questions${
          !topic.published ? ". Hidden from students until you publish it in Admin" : ""
        }`}
        subjectSwitch={false}
      />
      <TopicSetup topic={topic} subject={subject} startAction={startAction} />
      {topic.collection === "sqb" ? <p className="mt-8 max-w-2xl text-[13px] text-graphite">{SQB_CREDIT}</p> : null}
    </>
  );
}
