import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { SUBJECTS, isSubjectSlug } from "@/core/config/subjects";
import { Logo } from "@/core/design/ui";
import { ThemeToggle } from "@/core/layout";
import { getCurrentUser } from "@/features/auth";
import { getPracticeState } from "../queries";
import { PracticeResults } from "./PracticeResults";
import { PracticeRunner } from "./PracticeRunner";

export function PracticePage({ attemptId }: { attemptId: Promise<string> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-paper text-[17px] text-graphite" role="status">
          Opening your practice…
        </div>
      }
    >
      <Practice attemptId={attemptId} />
    </Suspense>
  );
}

async function Practice({ attemptId }: { attemptId: Promise<string> }) {
  const [user, state] = await Promise.all([getCurrentUser(), getPracticeState(await attemptId)]);
  if (!state) notFound();
  const subject = isSubjectSlug(state.subject) ? state.subject : "english";
  const backHref =
    state.kind === "topic" && state.setId
      ? `/${subject}/topics/${state.setId}`
      : state.kind === "monthly"
        ? `/${subject}/monthly`
        : `/${subject}/topics`;
  if (state.status === "abandoned") redirect(backHref);

  if (state.status === "in_progress") {
    return (
      <PracticeRunner
        key={state.attemptModuleId}
        state={state}
        studentName={user.name}
        canHighlight={SUBJECTS[subject].tools.includes("annotate")}
        exitHref={backHref}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 px-3 pb-4 pt-3 sm:px-5">
        <div className="glass mx-auto flex h-[54px] max-w-[1480px] items-center justify-between rounded-full pl-4 pr-2">
          <Link href={`/${subject}/dashboard`} className="text-ink" aria-label="Dashboard">
            <Logo size={28} />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <PracticeResults
        state={state}
        studentName={user.name}
        backHref={backHref}
        backLabel={state.kind === "monthly" ? "Back to monthly sets" : `Back to ${state.title}`}
      />
    </div>
  );
}
