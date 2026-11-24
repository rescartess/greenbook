import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/core/config/features";
import { requireSubject } from "@/core/config/subjects";
import { TopicsPage } from "@/features/topics";

export default async function Page({ params }: PageProps<"/[subject]/topics">) {
  if (!isFeatureEnabled("topics")) notFound();
  const subject = requireSubject((await params).subject);
  return <TopicsPage subject={subject} />;
}
