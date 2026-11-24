import type { Metadata } from "next";
import { AdminTestsPage } from "@/features/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function Page() {
  return <AdminTestsPage />;
}
