import type { Metadata } from "next";
import { TermsPage } from "@/features/marketing";

export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/terms" } };

export default function Page() {
  return <TermsPage />;
}
