import type { Metadata } from "next";
import { TestRunnerPreview } from "@/features/test-runner";

export const metadata: Metadata = { title: "Test screen preview", robots: { index: false } };

export default function Page() {
  return <TestRunnerPreview />;
}
