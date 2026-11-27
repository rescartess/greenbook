import type { Metadata } from "next";
import { HomePage } from "@/features/marketing";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: "QuantumTest", title: "QuantumTest, free SAT practice" },
  twitter: { card: "summary", title: "QuantumTest, free SAT practice" },
};

export default function Page() {
  return <HomePage />;
}
