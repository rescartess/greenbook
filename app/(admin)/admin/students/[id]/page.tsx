import type { Metadata } from "next";
import { StudentDetailPage } from "@/features/admin";

export const metadata: Metadata = { title: "Student" };

export default function Page({ params }: PageProps<"/admin/students/[id]">) {
  return <StudentDetailPage id={params.then((p) => p.id)} />;
}
