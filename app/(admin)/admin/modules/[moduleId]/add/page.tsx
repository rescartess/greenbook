import { AdminAddQuestionPage } from "@/features/admin";

export default function Page({ params }: PageProps<"/admin/modules/[moduleId]/add">) {
  return <AdminAddQuestionPage moduleId={params.then((p) => p.moduleId)} />;
}
