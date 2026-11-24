import { requireSubject } from "@/core/config/subjects";
import { DashboardPage } from "@/features/dashboard";

export default async function Page({ params }: PageProps<"/[subject]/dashboard">) {
  const subject = requireSubject((await params).subject);
  return <DashboardPage subject={subject} />;
}
