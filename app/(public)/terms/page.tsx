import type { Metadata } from "next";
import { TermsPage } from "@/features/marketing";

export const metadata: Metadata = { title: "Terms" };

export default function Page() {
  return <TermsPage />;
}
