"use client";

import { useState, useTransition } from "react";
import { BreakScreen } from "@/core/question";
import { startNextSection } from "../actions";

/** The break screen wired to "Resume Testing" (starts the same month's Math test). */
export function BreakRunner({
  attemptId,
  studentName,
  endsAt,
  serverNow,
}: {
  attemptId: string;
  studentName: string;
  endsAt: string;
  serverNow: string;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const resume = () => {
    if (pending) return;
    start(async () => {
      setMessage(null);
      // Opens the Math test on success; returns only when something went wrong.
      const result = await startNextSection(attemptId);
      setMessage(result.message);
    });
  };
  return (
    <BreakScreen
      studentName={studentName}
      endsAt={endsAt}
      serverNow={serverNow}
      onResume={resume}
      pending={pending}
      message={message}
    />
  );
}
