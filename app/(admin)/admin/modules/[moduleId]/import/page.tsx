import { AdminImportPage } from "@/features/admin";

export default function Page({ params }: PageProps<"/admin/modules/[moduleId]/import">) {
  return <AdminImportPage moduleId={params.then((p) => p.moduleId)} />;
}
