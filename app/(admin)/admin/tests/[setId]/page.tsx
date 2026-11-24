import { AdminTestPage } from "@/features/admin";

export default function Page({ params }: PageProps<"/admin/tests/[setId]">) {
  return <AdminTestPage setId={params.then((p) => p.setId)} />;
}
