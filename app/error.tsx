"use client";

import { Btn, BtnLink } from "@/core/shell";

/** Shown when a page fails to load. Answers already saved stay saved. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.01em]">This page didn’t load</h1>
        <p className="mt-2 max-w-md text-[16px] text-graphite">
          Check your connection and try again. Anything you already answered is saved.
        </p>
      </div>
      <div className="flex gap-2.5">
        <Btn onClick={reset}>Try again</Btn>
        <BtnLink href="/english/dashboard" tone="quiet">
          Go to your dashboard
        </BtnLink>
      </div>
    </main>
  );
}
