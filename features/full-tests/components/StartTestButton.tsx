"use client";

import { useActionState, useRef, useState } from "react";
import { cn } from "@/core/design/ui";
import { Btn } from "@/core/shell";
import { startTest, type StartState } from "../actions";
import type { FullTestRow, PartSize } from "../queries";

const size = (p: PartSize | null) => (p ? `${p.questions} questions · ${p.minutes} min` : "");

/**
 * Start a full test (owner request 28 Nov 2026): the button opens a small window with three
 * choices: the full test, Module 1 only, or Module 2 only (an adaptive test also asks Hard or
 * Easy). A test that is already running just continues where the student left off.
 */
export function StartTestButton({ test, title }: { test: FullTestRow; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tier, setTier] = useState<"harder" | "easier">("harder");

  if (test.inProgressId) return <PartForm setId={test.id} part="full" label="Continue exam" solid />;

  const close = () => dialog.current?.close();
  const full = test.parts.module1 && test.parts.harder
    ? `${test.questions} questions · ${test.minutes} min`
    : size(test.parts.module1);
  const second = tier === "easier" ? test.parts.easier : test.parts.harder;

  return (
    <>
      <Btn className="w-full" onClick={() => dialog.current?.showModal()}>
        Start exam
      </Btn>
      <dialog
        ref={dialog}
        aria-labelledby={`${test.id}-start`}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[var(--fp-r-card)] border border-hairline bg-paper p-0 text-ink shadow-[0_30px_80px_-20px_rgb(0_0_0/0.55)] backdrop:bg-black/55 backdrop:backdrop-blur-[2px]"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={`${test.id}-start`} className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]">
                {title}
              </h2>
              <p className="mt-1 text-[15px] text-graphite">All of it, or one module.</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-graphite transition-colors hover:bg-mist hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <PartForm setId={test.id} part="full" label="Full test" hint={full} />
            {test.parts.module1 ? <PartForm setId={test.id} part="module1" label="Module 1 only" hint={size(test.parts.module1)} /> : null}
            {test.parts.harder ? (
              <PartForm
                setId={test.id}
                part="module2"
                tier={test.parts.easier ? tier : "harder"}
                label="Module 2 only"
                hint={`${size(second)}${test.parts.easier ? "" : " · Hard"}`}
              >
                {test.parts.easier ? <TierSwitch tier={tier} onPick={setTier} /> : null}
              </PartForm>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}

/** One choice: a whole row that starts that part when pressed. */
function PartForm({
  setId,
  part,
  tier,
  label,
  hint,
  solid,
  children,
}: {
  setId: string;
  part: "full" | "module1" | "module2";
  tier?: "harder" | "easier";
  label: string;
  hint?: string;
  solid?: boolean;
  children?: React.ReactNode;
}) {
  const [state, action, pending] = useActionState(startTest.bind(null, setId), { message: null } as StartState);
  if (solid) {
    return (
      <form action={action} className="flex flex-col gap-1.5">
        <input type="hidden" name="part" value={part} />
        <Btn type="submit" disabled={pending} className="w-full">
          {pending ? "Opening…" : label}
        </Btn>
        {state.message ? <span role="alert" className="text-sm font-semibold">{state.message}</span> : null}
      </form>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-1.5">
      <input type="hidden" name="part" value={part} />
      {tier ? <input type="hidden" name="tier" value={tier} /> : null}
      <div
        className={cn(
          "flex items-center gap-3 rounded-[min(var(--fp-r-card),16px)] border border-hairline bg-mist p-1.5 pl-4 transition-colors",
          "has-[button[type=submit]:hover]:border-pine-soft has-[button[type=submit]:hover]:bg-pine-tint",
        )}
      >
        <div className="min-w-0 flex-1 py-1.5">
          <p className="text-[16px] font-bold">{label}</p>
          {hint ? <p className="mt-0.5 text-[13px] text-graphite tabular-nums">{hint}</p> : null}
          {children ? <div className="mt-2">{children}</div> : null}
        </div>
        <Btn type="submit" disabled={pending} className="shrink-0 px-4">
          {pending ? "Opening…" : "Start"}
        </Btn>
      </div>
      {state.message ? <span role="alert" className="px-1 text-sm font-semibold">{state.message}</span> : null}
    </form>
  );
}

/** Hard or Easy Module 2, for an adaptive test. */
function TierSwitch({ tier, onPick }: { tier: "harder" | "easier"; onPick: (t: "harder" | "easier") => void }) {
  return (
    <div role="radiogroup" aria-label="Module 2 level" className="inline-flex rounded-[var(--fp-r-btn)] border border-pine-soft bg-pine-tint p-0.5">
      {(["harder", "easier"] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={tier === t}
          onClick={() => onPick(t)}
          className={cn(
            "fp-label h-7 min-w-[64px] rounded-[var(--fp-r-btn)] px-3 text-[13px] font-extrabold transition-colors",
            tier === t ? "rp-btn-primary bg-pine text-pine-ink" : "text-pine hover:bg-paper/70",
          )}
        >
          {t === "harder" ? "Hard" : "Easy"}
        </button>
      ))}
    </div>
  );
}
