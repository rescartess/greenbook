import { AdminQuestionEditPage } from "@/features/admin";

export default function Page({
  params,
}: PageProps<"/admin/questions/[externalId]/edit">) {
  return (
    <AdminQuestionEditPage externalId={params.then((p) => p.externalId)} />
  );
}
