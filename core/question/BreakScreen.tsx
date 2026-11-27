"use client";

import { useEffect, useRef, useState } from "react";
import { formatClock } from "./ExamParts";
import { useMounted } from "./exam-hooks";

/** Length of the break between Reading and Writing and Math, like the real SAT. */
export const BREAK_MS = 10 * 60 * 1000;

/**
 * Bluebook's break between the two sections (owner request 28 Nov 2026): dark in light and dark
 * mode, the clock and Resume Testing on the left, what the break is like on test day on the right.
 * Our own wording. In practice the student can go on any time; at 0:00 the Math section starts.
 */
export function BreakScreen({
  studentName,
  endsAt,
  serverNow,
  onResume,
  pending,
  message,
}: {
  studentName: string;
  /** When the break ends (ISO time from the server). */
  endsAt: string;
  /** The server's time when the page was made, to correct this computer's clock. */
  serverNow: string;
  onResume: () => void;
  pending: boolean;
  message: string | null;
}) {
  const mounted = useMounted();
  const [offset] = useState(() => new Date(serverNow).getTime() - Date.now());
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState(() => Date.now() + offset);
  const left = Math.max(0, end - now);

  // Only a break that runs out while the page is open moves on by itself; one that ended
  // long ago (the page opened later) waits for the button.
  const wasRunning = useRef(left > 0);
  const resumeRef = useRef(onResume);
  useEffect(() => {
    resumeRef.current = onResume;
  }, [onResume]);
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now() + offset;
      setNow(t);
      if (wasRunning.current && t >= end) {
        wasRunning.current = false;
        resumeRef.current();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [end, offset]);

  return (
    <div className="exam min-h-dvh bg-[#1a1a1a] font-sans text-white">
      <main className="mx-auto grid min-h-dvh max-w-[1500px] gap-12 px-6 pb-28 pt-12 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-20">
        <section aria-label="Break clock" className="flex flex-col items-center justify-center gap-8 lg:pb-16">
          <div className="w-full max-w-[300px] rounded-[10px] border-2 border-white px-6 pb-4 pt-5 text-center">
            <p className="text-[19px] font-bold">Remaining Break Time:</p>
            <p className="mt-1 text-[64px] font-bold leading-none tabular-nums" aria-live="off">
              {mounted ? formatClock(left) : " "}
            </p>
          </div>
          <button
            type="button"
            onClick={onResume}
            disabled={pending}
            className="rounded-full bg-[#fedb00] px-7 py-3.5 text-[17px] font-bold text-[#1a1a1a] hover:brightness-95 disabled:opacity-70"
          >
            {pending ? "Starting…" : "Resume Testing"}
          </button>
          {message ? (
            <p role="alert" className="max-w-[320px] text-center text-[15px] font-semibold text-[#ffd8a8]">
              {message}
            </p>
          ) : null}
        </section>

        <section className="max-w-[660px] text-[18px] leading-[1.65] lg:pt-12">
          <h1 className="text-[32px] font-bold leading-tight tracking-[-0.02em] sm:text-[36px]">Practice Test Break</h1>
          <p className="mt-6">
            You can go on with this practice test whenever you’re ready. On test day, you wait until the clock reaches
            zero. Here’s how the break works on test day.
          </p>
          <hr className="my-9 border-white/80" />
          <h2 className="text-[32px] font-bold leading-tight tracking-[-0.02em] sm:text-[36px]">
            Take a Break: Keep Your Device Open
          </h2>
          <p className="mt-6">
            When the break ends, a <strong>Resume Testing Now</strong> button appears and the next section begins.
          </p>
          <p className="mt-7 font-bold">During the break:</p>
          <ol className="mt-4 list-decimal space-y-4 pl-7 marker:font-normal">
            <li>Stay quiet around students who are still testing.</li>
            <li>Keep the app open and don’t close your laptop.</li>
            <li>Stay away from phones, smartwatches, textbooks, notes and the internet.</li>
            <li>Keep food and drinks away from every testing device.</li>
            <li>Don’t talk in the testing room or discuss the test with anyone.</li>
          </ol>
        </section>
      </main>
      <p className="fixed bottom-6 left-6 max-w-[60vw] truncate text-[20px] font-medium sm:left-10 sm:text-[22px]">{studentName}</p>
    </div>
  );
}
