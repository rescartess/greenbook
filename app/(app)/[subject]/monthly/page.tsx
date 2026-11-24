import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/core/config/features";
import { requireSubject } from "@/core/config/subjects";
import { MonthlyPage } from "@/features/monthly";

export const metadata: Metadata = { title: "By month" };

export default async function Page({ params }: PageProps<"/[subject]/monthly">) {
  if (!isFeatureEnabled("monthly")) notFound();
  const subject = requireSubject((await params).subject);
  return <MonthlyPage subject={subject} />;
}
