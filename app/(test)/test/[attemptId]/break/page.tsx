import type { Metadata } from "next";
import { BreakPage } from "@/features/test-runner";

export const metadata: Metadata = { title: "Break", robots: { index: false } };

export default function Page({ params }: PageProps<"/test/[attemptId]/break">) {
  return <BreakPage attemptId={params.then((p) => p.attemptId)} />;
}
