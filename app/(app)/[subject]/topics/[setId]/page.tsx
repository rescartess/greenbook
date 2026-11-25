import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isFeatureEnabled } from "@/core/config/features";
import { requireSubject } from "@/core/config/subjects";
import { TopicPage } from "@/features/topics";

export const metadata: Metadata = { title: "Topic practice" };

export default function Page({ params }: PageProps<"/[subject]/topics/[setId]">) {
  if (!isFeatureEnabled("topics")) notFound();
  return (
    <Suspense>
      {params.then(({ subject, setId }) => (
        <TopicPage subject={requireSubject(subject)} setId={Promise.resolve(setId)} />
      ))}
    </Suspense>
  );
}
