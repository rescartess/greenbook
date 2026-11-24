import type { Metadata } from "next";
import { PracticePage } from "@/features/practice";

export const metadata: Metadata = { title: "Practice", robots: { index: false } };

export default function Page({ params }: PageProps<"/practice/[attemptId]">) {
  return <PracticePage attemptId={params.then((p) => p.attemptId)} />;
}
