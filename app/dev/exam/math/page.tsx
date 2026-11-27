import type { Metadata } from "next";
import { TestRunnerPreview } from "@/features/test-runner";

export const metadata: Metadata = { title: "Math test screen preview", robots: { index: false } };

export default function Page() {
  return <TestRunnerPreview subject="math" />;
}
