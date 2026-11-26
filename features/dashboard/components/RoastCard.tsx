"use client";

import { useState } from "react";
import { Btn, Card } from "@/core/shell";
import { pickRoast } from "../roasts";

/** A random roast line, new on every page load; "Roast me again" picks another one. */
export function RoastCard({ first }: { first: string }) {
  const [line, setLine] = useState(first);
  return (
    <Card className="flex flex-col">
      <p aria-live="polite" className="text-[22px] font-bold leading-snug tracking-[-0.01em] sm:text-[24px]">
        {line}
      </p>
      <div className="mt-auto pt-6">
        <Btn tone="quiet" onClick={() => setLine((l) => pickRoast(l))}>
          Roast me again
        </Btn>
      </div>
    </Card>
  );
}
