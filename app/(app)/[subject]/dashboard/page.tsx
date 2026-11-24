import { requireSubject } from "@/core/config/subjects";
import { getCurrentUser } from "@/features/auth";
import { DashboardPage, getDashboard } from "@/features/dashboard";

export default async function Page({ params }: PageProps<"/[subject]/dashboard">) {
  const subject = requireSubject((await params).subject);
  const [user, data] = await Promise.all([getCurrentUser(), getDashboard(subject)]);
  return <DashboardPage subject={subject} data={data} firstName={user.name.split(" ")[0]} />;
}
