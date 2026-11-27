"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import { BREAK_MS, BreakScreen } from "@/core/question";

/** Local-only preview of the break screen (made-up student), for checking the design. */
export function BreakPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Preview />;
}

function Preview() {
  const [times] = useState(() => {
    const now = Date.now();
    return { now: new Date(now).toISOString(), ends: new Date(now + BREAK_MS - 11_000).toISOString() };
  });
  return (
    <BreakScreen
      studentName="Aziza Karimova"
      endsAt={times.ends}
      serverNow={times.now}
      onResume={() => console.log("Math would start now.")}
      pending={false}
      message={null}
    />
  );
}
