import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/core/design/ui";
import { ThemeToggle } from "@/core/layout";
import { getPracticeState } from "../queries";
import { PracticeRunner } from "./PracticeRunner";

export function PracticePage({ attemptId }: { attemptId: Promise<string> }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 px-3 pb-4 pt-3 sm:px-5">
        <div className="glass mx-auto flex h-[54px] max-w-[1480px] items-center justify-between rounded-full pl-4 pr-2">
          <Link href="/" className="text-ink">
            <Logo size={28} />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <Suspense fallback={<p className="px-5 text-graphite">Opening your practice…</p>}>
        <Runner attemptId={attemptId} />
      </Suspense>
    </div>
  );
}

async function Runner({ attemptId }: { attemptId: Promise<string> }) {
  const state = await getPracticeState(await attemptId);
  if (!state) notFound();
  const subject = state.subject === "math" ? "math" : "english";
  return <PracticeRunner state={state} backHref={`/${subject}/topics`} />;
}
