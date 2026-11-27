import type { Metadata } from "next";
import { PrivacyPage } from "@/features/marketing";

export const metadata: Metadata = { title: "Privacy" };

export default function Page() {
  return <PrivacyPage />;
}
