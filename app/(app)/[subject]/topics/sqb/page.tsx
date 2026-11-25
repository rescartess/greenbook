import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/core/config/features";
import { requireSubject } from "@/core/config/subjects";
import { TopicsPage } from "@/features/topics";

export const metadata: Metadata = { title: "SQB topics" };

export default async function Page({ params }: PageProps<"/[subject]/topics/sqb">) {
  if (!isFeatureEnabled("topics")) notFound();
  const subject = requireSubject((await params).subject);
  return <TopicsPage subject={subject} collection="sqb" />;
}
