import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isFeatureEnabled } from "@/core/config/features";
import { requireSubject } from "@/core/config/subjects";
import { ResultDetailPage } from "@/features/results";

export default function Page({ params }: PageProps<"/[subject]/results/[attemptId]">) {
  if (!isFeatureEnabled("results")) notFound();
  return (
    <Suspense>
      {params.then(({ subject, attemptId }) => (
        <ResultDetailPage subject={requireSubject(subject)} attemptId={Promise.resolve(attemptId)} />
      ))}
    </Suspense>
  );
}
