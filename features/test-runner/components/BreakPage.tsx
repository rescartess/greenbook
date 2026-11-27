import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BREAK_MS } from "@/core/question";
import { getCurrentUser } from "@/features/auth";
import { nextSectionAfter } from "../queries";
import { isUuid } from "../ids";
import { BreakRunner } from "./BreakRunner";

/** /test/[attemptId]/break: the 10-minute break after an English adaptive test, before its Math test. */
export function BreakPage({ attemptId }: { attemptId: Promise<string> }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-ink" role="status" aria-label="Loading" />}>
      <Break attemptId={attemptId} />
    </Suspense>
  );
}

async function Break({ attemptId }: { attemptId: Promise<string> }) {
  const id = await attemptId;
  if (!isUuid(id)) notFound();
  await connection();
  const [user, next] = await Promise.all([getCurrentUser(), nextSectionAfter(id)]);
  if (!next) redirect(`/english/results/${id}`);
  if (next.status === "in_progress") redirect(`/test/${id}`);
  if (next.status !== "completed") redirect("/english/full-tests");
  const serverNow = new Date();
  const finished = next.finishedAt ? new Date(next.finishedAt) : serverNow;
  return (
    <BreakRunner
      attemptId={id}
      studentName={user.name}
      endsAt={new Date(finished.getTime() + BREAK_MS).toISOString()}
      serverNow={serverNow.toISOString()}
    />
  );
}
