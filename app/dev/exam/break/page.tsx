import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BreakPreview } from "@/features/test-runner";

export const metadata: Metadata = { title: "Break screen preview", robots: { index: false } };

async function Preview() {
  await connection();
  return <BreakPreview />;
}

export default function Page() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}
