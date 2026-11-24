import { AdminQuestionPage } from "@/features/admin";

export default function Page({
  params,
}: PageProps<"/admin/questions/[externalId]">) {
  return <AdminQuestionPage externalId={params.then((p) => p.externalId)} />;
}
