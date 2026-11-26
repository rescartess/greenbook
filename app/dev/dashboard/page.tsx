import type { Metadata } from "next";
import { DashboardPreview } from "@/features/dashboard";

export const metadata: Metadata = { title: "Dashboard preview", robots: { index: false } };

export default function Page() {
  return <DashboardPreview />;
}
