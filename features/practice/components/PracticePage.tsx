import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { SUBJECTS, isSubjectSlug } from "@/core/config/subjects";
import { Logo } from "@/core/design/ui";
import { BerryStripe, ThemeButton } from "@/core/shell";
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
        exitHref={`/${subject}/results`}
      />
    );
  }

  return (
    <FinishedFrame subject={subject}>
      <PracticeResults
        state={state}
        studentName={user.name}
        backHref={`/${subject}/results`}
        backLabel="All results"
      />
    </FinishedFrame>
  );
}

/** Page frame for a finished practice: a flat top bar with the logo, Results and the theme button. */
export function FinishedFrame({ subject, children }: { subject: string; children: React.ReactNode }) {
  return (
    <div className="gb-colors min-h-dvh bg-canvas">
      <BerryStripe />
      <header className="border-b border-hairline bg-paper pt-1.5">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8">
          <Link href={`/${subject}/dashboard`} className="text-ink" aria-label="Dashboard">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/${subject}/results`} className="text-[15px] font-semibold text-ink-soft hover:text-ink">
              Results
            </Link>
            <ThemeButton />
          </div>
        </div>
      </header>
      <div className="pt-8">{children}</div>
    </div>
  );
}
