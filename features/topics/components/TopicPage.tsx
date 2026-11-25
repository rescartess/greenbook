import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { SubjectSlug } from "@/core/config/subjects";
import { startTopicPractice } from "@/features/practice";
import { getTopic } from "../queries";
import { TopicSetup } from "./TopicSetup";

/** One topic: choose level, range, checking and timer, then start. */
export function TopicPage({ subject, setId }: { subject: SubjectSlug; setId: Promise<string> }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-panel bg-paper" />}>
      <Topic subject={subject} setId={setId} />
    </Suspense>
  );
}

async function Topic({ subject, setId }: { subject: SubjectSlug; setId: Promise<string> }) {
  const topic = await getTopic(await setId);
  if (!topic || topic.subject !== subject) notFound();
  return (
    <>
      <header className="mb-6 pt-1 sm:pt-3">
        <Link href={`/${subject}/topics`} className="text-[15px] font-semibold text-pine hover:underline">
          Topics
        </Link>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-[40px] sm:leading-tight">{topic.title}</h1>
        <p className="mt-1 text-[17px] text-graphite">
          {topic.description ? `${topic.description} ` : ""}
          {topic.items.length} questions.
          {!topic.published ? " Hidden from students until you publish it in Admin." : ""}
        </p>
      </header>
      <TopicSetup topic={topic} subject={subject} startAction={startTopicPractice} />
    </>
  );
}
