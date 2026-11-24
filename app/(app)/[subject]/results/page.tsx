import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/core/config/features";
import { requireSubject } from "@/core/config/subjects";
import { ResultsPage } from "@/features/results";

export const metadata: Metadata = { title: "Results" };

export default async function Page({ params }: PageProps<"/[subject]/results">) {
  if (!isFeatureEnabled("results")) notFound();
  const subject = requireSubject((await params).subject);
  return <ResultsPage subject={subject} />;
}
