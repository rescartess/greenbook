import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/core/config/features";
import { requireSubject } from "@/core/config/subjects";
import { FullTestsPage } from "@/features/full-tests";

export default async function Page({ params }: PageProps<"/[subject]/full-tests">) {
  if (!isFeatureEnabled("full-tests")) notFound();
  const subject = requireSubject((await params).subject);
  return <FullTestsPage subject={subject} />;
}
