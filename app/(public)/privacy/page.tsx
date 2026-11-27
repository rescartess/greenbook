import type { Metadata } from "next";
import { PrivacyPage } from "@/features/marketing";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function Page() {
  return <PrivacyPage />;
}
