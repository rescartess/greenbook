"use client";

import { useState } from "react";
import { AnswerCheck } from "@/core/question";
import { retryMistake } from "../actions";
import type { Mistake } from "../schema";

/** Try one mistake again. Two right in a row and it leaves the list (on the next visit). */
export function MistakeRetry({ mistake, number }: { mistake: Mistake; number: number }) {
  const [round, setRound] = useState(0);
  const [mastered, setMastered] = useState(false);
  return (
    <AnswerCheck
      key={round}
      number={number}
      question={mistake}
      onCheck={async (answer) => {
        const f = await retryMistake(mistake.id, answer);
        setMastered(f.mastered);
        return f;
      }}
      after={(f) =>
        mastered ? (
          <p className="text-[15px] font-bold text-pine">Two right in a row. This question leaves your list.</p>
        ) : f.isCorrect ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[15px] text-ink-soft">Get it right once more to clear it.</p>
            <button type="button" onClick={() => setRound((r) => r + 1)} className="rounded-full bg-wash px-4 py-2 text-sm font-bold hover:bg-hairline">
              Try again
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setRound((r) => r + 1)} className="rounded-full bg-wash px-4 py-2 text-sm font-bold hover:bg-hairline">
            Try again
          </button>
        )
      }
    />
  );
}
