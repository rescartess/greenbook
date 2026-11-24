import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/core/config/features";
import { requireSubject } from "@/core/config/subjects";
import { MistakesPage } from "@/features/mistakes";

export const metadata: Metadata = { title: "Mistakes" };

export default async function Page({ params }: PageProps<"/[subject]/mistakes">) {
  if (!isFeatureEnabled("mistakes")) notFound();
  const subject = requireSubject((await params).subject);
  return <MistakesPage subject={subject} />;
}
