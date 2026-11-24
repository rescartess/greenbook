import type { Metadata } from "next";
import { requireSubject } from "@/core/config/subjects";
import { DashboardPage } from "@/features/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Page({ params }: PageProps<"/[subject]/dashboard">) {
  const subject = requireSubject((await params).subject);
  return <DashboardPage subject={subject} />;
}
