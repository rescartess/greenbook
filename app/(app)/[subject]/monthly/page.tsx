import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/core/config/features";
import { requireSubject } from "@/core/config/subjects";
import { MonthlyPage } from "@/features/monthly";

export default async function Page({ params }: PageProps<"/[subject]/monthly">) {
  if (!isFeatureEnabled("monthly")) notFound();
  const subject = requireSubject((await params).subject);
  return <MonthlyPage subject={subject} />;
}
