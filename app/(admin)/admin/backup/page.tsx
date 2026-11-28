import type { Metadata } from "next";
import { BackupPage } from "@/features/admin";

export const metadata: Metadata = { title: "Backup", robots: { index: false } };

export default function Page() {
  return <BackupPage />;
}
