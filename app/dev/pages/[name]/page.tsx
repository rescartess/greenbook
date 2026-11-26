import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ComponentType } from "react";
import { TopicPreview, TopicsPreview } from "@/features/topics";

export const metadata: Metadata = { title: "Page preview", robots: { index: false } };

/** Local-only previews of the pages around the exam, with made-up data. Hidden in production. */
const PAGES: Record<string, ComponentType> = {
  topics: TopicsPreview,
  topic: TopicPreview,
};

export default function Page({ params }: { params: Promise<{ name: string }> }) {
  return (
    <Suspense>
      <Preview name={params.then((p) => p.name)} />
    </Suspense>
  );
}

async function Preview({ name }: { name: Promise<string> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const Chosen = PAGES[await name];
  if (!Chosen) notFound();
  return <Chosen />;
}
