import type { Metadata } from "next";
import { ImportBookPage } from "@/features/admin";

export const metadata: Metadata = { title: "Import a book", robots: { index: false } };

export default function Page() {
  return <ImportBookPage />;
}
