import type { Metadata } from "next";
import { StudentsPage } from "@/features/admin";

export const metadata: Metadata = { title: "Students" };

export default function Page() {
  return <StudentsPage />;
}
