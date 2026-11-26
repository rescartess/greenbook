import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isFeatureEnabled } from "@/core/config/features";
import { requireSubject } from "@/core/config/subjects";
import { MistakeSetPage } from "@/features/mistakes";

export const metadata: Metadata = { title: "Mistakes" };

export default function Page({ params }: PageProps<"/[subject]/mistakes/[practice]">) {
  if (!isFeatureEnabled("mistakes")) notFound();
  return (
    <Suspense>
      {params.then(({ subject, practice }) => (
        <MistakeSetPage subject={requireSubject(subject)} practiceKey={Promise.resolve(practice)} />
      ))}
    </Suspense>
  );
}
