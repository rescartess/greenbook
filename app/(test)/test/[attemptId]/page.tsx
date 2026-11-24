import type { Metadata } from "next";
import { TestRunnerPage } from "@/features/test-runner";

export const metadata: Metadata = { title: "Test", robots: { index: false } };

export default function Page({ params }: PageProps<"/test/[attemptId]">) {
  return <TestRunnerPage attemptId={params.then((p) => p.attemptId)} />;
}
