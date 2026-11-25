"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Button, cn, Icon } from "@/core/design/ui";
import {
  mergeSpans,
  paintHighlights,
  QuestionView,
  spanFromRange,
  type Span,
} from "@/core/question";
import { finishModule, saveAnswer } from "../actions";
import { formatClock, type RunnerResponse, type TestState } from "../schema";
import { Calculator, DESMOS_KEY, ReferenceSheet } from "./Tools";

type Running = Extract<TestState, { status: "in_progress" }>;
type View = { kind: "question"; index: number } | { kind: "review" };

type Tool = "annotate" | "calculator" | "reference";

type Props = {
  state: Running;
  sectionName: string;
  studentName: string;
  resultsHref: string;
  /** From SUBJECTS[subject].tools: highlighter for English, calculator and reference for Math. */
  tools: readonly Tool[];
  /** 1 for Reading and Writing, 2 for Math, like the real test. */
  sectionNumber: number;
  /** Short paragraphs shown under "Directions". */
  directions: readonly string[];
};

const EMPTY: RunnerResponse = { answer: null, marked: false, eliminated: [] };

/** The Bluebook-style test screen for one module. Answers save as the student goes; the server keeps the clock. */
export function TestRunner({
  state,
  sectionName,
  studentName,
  resultsHref,
  tools,
  sectionNumber,
  directions,
}: Props) {
  const router = useRouter();
  const { module, questions } = state;
  const amId = module.attemptModuleId;

  const [view, setView] = useState<View>(() => {
    const firstOpen = questions.findIndex(
      (q) => !state.responses[q.id]?.answer,
    );
    return { kind: "question", index: firstOpen === -1 ? 0 : firstOpen };
  });
  const [responses, setResponses] = useState<Record<string, RunnerResponse>>(
    state.responses,
  );
  const [mapOpen, setMapOpen] = useState(false);
  const [crossOut, setCrossOut] = useState(false);
  const [hideClock, setHideClock] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [panel, setPanel] = useState<"calculator" | "reference" | null>(null);
  const [highlighting, setHighlighting] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [split, setSplit] = useState(50);
  const marksKey = `gb-marks-${amId}`;
  const [marks, setMarks] = useState<Record<string, Span[]>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.sessionStorage.getItem(marksKey) ?? "{}");
    } catch {
      return {};
    }
  });
  const mainRef = useRef<HTMLElement>(null);
  // False while the server draws the page and during hydration, true once running in the browser.
  // The clock and highlights wait for it, so the server's and the browser's first drawing match.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  // ---- clock: the server's deadline, corrected for this computer's clock ----
  const [offset] = useState(
    () => new Date(module.serverNow).getTime() - Date.now(),
  );
  const deadline = module.deadlineAt
    ? new Date(module.deadlineAt).getTime()
    : null;
  const [now, setNow] = useState(() => Date.now() + offset);
  const remaining = deadline === null ? null : deadline - now;
  const lowTime = remaining !== null && remaining <= 5 * 60 * 1000;

  // ---- saving: one at a time, in order, retried on network trouble ----
  const queue = useRef<Promise<void>>(Promise.resolve());
  const enteredAt = useRef<number>(0);
  const save = useCallback(
    (questionId: string, response: RunnerResponse, seconds = 0) => {
      queue.current = queue.current.then(async () => {
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            const result = await saveAnswer({
              attemptModuleId: amId,
              questionId,
              ...response,
              seconds,
            });
            if (result.ok) {
              setProblem(null);
              return;
            }
            setProblem(result.message);
            if (result.reload) {
              router.refresh();
              return;
            }
          } catch {
            setProblem(
              "Your last answer didn’t save. Check your connection; we’ll keep trying.",
            );
          }
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        }
      });
    },
    [amId, router],
  );

  const update = (questionId: string, change: Partial<RunnerResponse>) => {
    const next = { ...(responses[questionId] ?? EMPTY), ...change };
    setResponses((all) => ({ ...all, [questionId]: next }));
    save(questionId, next);
  };

  // Time spent on a question is sent when the student moves away from it.
  const go = (next: View) => {
    if (view.kind === "question") {
      const q = questions[view.index];
      const seconds = (Date.now() - enteredAt.current) / 1000;
      if (q && seconds >= 1) save(q.id, responses[q.id] ?? EMPTY, seconds);
    }
    enteredAt.current = Date.now();
    setMapOpen(false);
    setConfirming(false);
    setView(next);
    window.scrollTo({ top: 0 });
  };

  // ---- finishing the module (by the student or because time ran out) ----
  const finishingRef = useRef(false);
  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    await queue.current;
    const result = await finishModule(amId);
    if (!result.ok) {
      setProblem(result.message);
      finishingRef.current = false;
      setFinishing(false);
      return;
    }
    if (result.completed) router.replace(resultsHref);
    else router.refresh();
  }, [amId, resultsHref, router]);

  // Tick the clock; when time is up, finish the module (the server would close it anyway).
  const finishRef = useRef(finish);
  const lastTry = useRef(0);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);
  useEffect(() => {
    enteredAt.current = Date.now();
    const id = window.setInterval(() => {
      const t = Date.now() + offset;
      setNow(t);
      // Time is up: finish, retrying at most every 5 seconds if the connection is down.
      if (
        deadline !== null &&
        t >= deadline &&
        Date.now() - lastTry.current > 5000
      ) {
        lastTry.current = Date.now();
        void finishRef.current();
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [offset, deadline]);

  const current = view.kind === "question" ? questions[view.index] : null;

  // Show this question's highlights (they're drawn by the browser, not added to the page).
  useEffect(() => {
    const passage =
      mainRef.current?.querySelector<HTMLElement>("[data-passage]") ?? null;
    paintHighlights(passage, current ? (marks[current.id] ?? []) : []);
    try {
      window.sessionStorage.setItem(marksKey, JSON.stringify(marks));
    } catch {
      // Private browsing: highlights just won't survive a reload.
    }
  }, [current, marks, marksKey]);

  const addHighlight = () => {
    if (!highlighting || !current) return;
    const passage =
      mainRef.current?.querySelector<HTMLElement>("[data-passage]");
    const selection = window.getSelection();
    if (
      !passage ||
      !selection ||
      selection.isCollapsed ||
      selection.rangeCount === 0
    )
      return;
    const span = spanFromRange(passage, selection.getRangeAt(0));
    if (!span) return;
    setMarks((all) => ({
      ...all,
      [current.id]: mergeSpans([...(all[current.id] ?? []), span]),
    }));
    selection.removeAllRanges();
  };
  const answeredCount = questions.filter((q) => responses[q.id]?.answer).length;
  const moduleLabel = `Module ${module.number}`;
  const finishLabel = module.isLast
    ? "Finish test"
    : `Finish module ${module.number}`;

  return (
    <div className="min-h-dvh bg-paper font-sans">
      {/* Top bar: section and directions, timer, tools */}
      <header className="sticky top-0 z-30 bg-pine-tint font-sans">
        <div className="mx-auto grid min-h-[72px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-8">
          <div className="relative min-w-0">
            <p className="truncate text-[15px] font-bold sm:text-[17px]">
              <span className="hidden sm:inline">
                Section {sectionNumber},{" "}
              </span>
              {moduleLabel}
              <span className="hidden sm:inline">: {sectionName}</span>
            </p>
            <button
              type="button"
              aria-expanded={directionsOpen}
              onClick={() => setDirectionsOpen((o) => !o)}
              className="mt-0.5 flex items-center gap-1 text-[15px] hover:underline"
            >
              Directions
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
                className={cn(
                  "transition-transform",
                  directionsOpen && "rotate-180",
                )}
              >
                <path
                  d="m2 4 4 4 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </button>
            {directionsOpen ? (
              <div
                role="dialog"
                aria-label="Directions"
                className="absolute left-0 top-full z-40 mt-3 w-[min(560px,90vw)] rounded-panel border border-hairline bg-paper p-6 shadow-lg"
              >
                {directions.map((d) => (
                  <p
                    key={d}
                    className="mb-3 text-[15px] leading-relaxed last:mb-0"
                  >
                    {d}
                  </p>
                ))}
                <div className="mt-4 flex justify-end">
                  <Button size="sm" onClick={() => setDirectionsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-1" aria-live="polite">
            {remaining === null ? null : !mounted ? (
              <span className="h-7" aria-hidden="true" />
            ) : hideClock ? (
              <span className="flex h-7 items-center text-sm text-graphite">
                Timer hidden
              </span>
            ) : (
              <span
                className={cn(
                  "text-[22px] font-bold leading-7 tabular-nums",
                  lowTime && "text-pine",
                )}
                aria-label={`Time left ${formatClock(remaining)}`}
              >
                {formatClock(remaining)}
              </span>
            )}
            {remaining !== null ? (
              <button
                type="button"
                onClick={() => setHideClock((h) => !h)}
                className="rounded-full border-[1.5px] border-ink px-3 py-px text-[13px] font-semibold hover:bg-paper"
              >
                {hideClock ? "Show" : "Hide"}
              </button>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            {tools.includes("annotate") ? (
              <ToolButton
                label="Highlight"
                pressed={highlighting}
                onClick={() => setHighlighting((h) => !h)}
              >
                <path d="M4 20h6M14.5 4.5l5 5L10 19H5v-5z" />
              </ToolButton>
            ) : null}
            {tools.includes("calculator") && DESMOS_KEY ? (
              <ToolButton
                label="Calculator"
                pressed={panel === "calculator"}
                onClick={() =>
                  setPanel((p) => (p === "calculator" ? null : "calculator"))
                }
              >
                <path d="M6 3h12v18H6zM9 7h6M9 12h1M14 12h1M9 16h1M14 16h1" />
              </ToolButton>
            ) : null}
            {tools.includes("reference") ? (
              <ToolButton
                label="Reference"
                pressed={panel === "reference"}
                onClick={() =>
                  setPanel((p) => (p === "reference" ? null : "reference"))
                }
              >
                <path d="M5 4h10l4 4v12H5zM9 11h6M9 15h4M14 4v5h5" />
              </ToolButton>
            ) : null}
          </div>
        </div>
        <div className="border-b-[3px] border-dashed border-ink/70" />
      </header>

      {problem ? (
        <p
          role="alert"
          className="mx-auto mt-3 max-w-[1600px] px-4 font-sans sm:px-8"
        >
          <span className="block rounded-choice bg-wash px-4 py-2.5 text-[15px] font-semibold">
            {problem}
          </span>
        </p>
      ) : null}

      {/* Question or review page */}
      <main
        ref={mainRef}
        onMouseUp={addHighlight}
        onTouchEnd={addHighlight}
        className={cn(
          "mx-auto max-w-[1600px] pb-28",
          highlighting && "[&_[data-passage]]:cursor-text",
        )}
      >
        {current ? (
          <QuestionView
            key={current.id}
            number={current.position}
            question={current}
            selectedId={responses[current.id]?.answer ?? null}
            eliminated={responses[current.id]?.eliminated ?? []}
            onChoose={(id) => {
              const r = responses[current.id] ?? EMPTY;
              update(current.id, {
                answer: id,
                eliminated: r.eliminated.filter((e) => e !== id),
              });
            }}
            onToggleEliminate={
              crossOut
                ? (id) => {
                    const r = responses[current.id] ?? EMPTY;
                    const out = r.eliminated.includes(id);
                    update(current.id, {
                      eliminated: out
                        ? r.eliminated.filter((e) => e !== id)
                        : [...r.eliminated, id],
                      answer: !out && r.answer === id ? null : r.answer,
                    });
                  }
                : undefined
            }
            passageWidth={split}
            onResize={setSplit}
            fillHeight
            headerExtra={
              <button
                type="button"
                aria-pressed={responses[current.id]?.marked ?? false}
                onClick={() =>
                  update(current.id, {
                    marked: !(responses[current.id]?.marked ?? false),
                  })
                }
                className={cn(
                  "flex items-center gap-1.5 text-[15px]",
                  responses[current.id]?.marked
                    ? "font-bold"
                    : "hover:underline",
                )}
              >
                <svg
                  width="16"
                  height="18"
                  viewBox="0 0 16 18"
                  aria-hidden="true"
                  className={responses[current.id]?.marked ? "text-pine" : ""}
                >
                  <path
                    d="M2.5 1.5h11v15L8 12.5l-5.5 4z"
                    fill={
                      responses[current.id]?.marked ? "currentColor" : "none"
                    }
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                {responses[current.id]?.marked
                  ? "Marked for Review"
                  : "Mark for Review"}
              </button>
            }
            headerRight={
              <>
                {mounted && marks[current.id]?.length ? (
                  <button
                    type="button"
                    onClick={() =>
                      setMarks((all) => ({ ...all, [current.id]: [] }))
                    }
                    className="mr-3 text-[13px] text-ink-soft hover:underline"
                  >
                    Clear highlights
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-pressed={crossOut}
                  aria-label="Cross out answer choices"
                  title="Cross out answer choices"
                  onClick={() => setCrossOut((c) => !c)}
                  className={cn(
                    "rounded-md border-[1.5px] border-ink px-1.5 py-px text-[12px] font-bold line-through decoration-[1.5px]",
                    crossOut ? "bg-ink text-paper" : "bg-paper hover:bg-wash",
                  )}
                >
                  ABC
                </button>
              </>
            }
            answerSlot={
              current.type === "spr" ? (
                <TypedAnswer
                  key={current.id}
                  initial={responses[current.id]?.answer ?? ""}
                  onCommit={(value) =>
                    update(current.id, { answer: value || null })
                  }
                />
              ) : undefined
            }
          />
        ) : (
          <ReviewPage
            title={`${sectionName}, ${moduleLabel}`}
            questions={questions}
            responses={responses}
            answeredCount={answeredCount}
            onPick={(index) => go({ kind: "question", index })}
            footer={
              confirming ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[17px] font-bold">
                    {module.isLast
                      ? "Finish the test now?"
                      : "Finish this module now?"}{" "}
                    You can’t come back to it.
                  </p>
                  <div className="flex gap-2.5">
                    <Button
                      variant="quiet"
                      onClick={() => setConfirming(false)}
                      disabled={finishing}
                    >
                      Keep working
                    </Button>
                    <Button onClick={() => void finish()} disabled={finishing}>
                      {finishing ? "Finishing…" : finishLabel}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="lg" onClick={() => setConfirming(true)}>
                  {finishLabel}
                </Button>
              )
            }
          />
        )}
      </main>

      {/* Question map */}
      {mapOpen ? (
        <div className="fixed inset-x-3 bottom-[84px] z-40 mx-auto max-w-[560px] font-sans">
          <div
            className="rounded-card border border-hairline bg-paper p-5 shadow-lg"
            role="dialog"
            aria-label="Questions in this module"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold">
                {sectionName}, {moduleLabel}
              </p>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="rounded-full px-3 py-1 text-sm font-semibold hover:bg-wash"
              >
                Close
              </button>
            </div>
            <QuestionGrid
              questions={questions}
              responses={responses}
              currentId={current?.id}
              onPick={(index) => go({ kind: "question", index })}
            />
            <div className="mt-5 flex justify-center">
              <Button
                variant="quiet"
                size="sm"
                onClick={() => go({ kind: "review" })}
              >
                Go to review page
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {panel === "calculator" ? (
        <Calculator onClose={() => setPanel(null)} />
      ) : null}
      {panel === "reference" ? (
        <ReferenceSheet onClose={() => setPanel(null)} />
      ) : null}
      {highlighting ? (
        <p className="fixed inset-x-0 top-[86px] z-20 mx-auto w-fit rounded-full bg-ink px-4 py-1.5 font-sans text-[13px] font-semibold text-paper">
          Select words in the passage to highlight them
        </p>
      ) : null}

      {/* Bottom bar: name, question map, Back / Next */}
      <footer className="fixed inset-x-0 bottom-0 z-30 bg-pine-tint font-sans">
        <div className="border-t-[3px] border-dashed border-ink/70" />
        <div className="mx-auto grid h-[68px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-8">
          <span className="hidden min-w-0 truncate text-[15px] font-bold sm:block">
            {studentName}
          </span>
          <button
            type="button"
            onClick={() => setMapOpen((o) => !o)}
            aria-expanded={mapOpen}
            className="col-start-2 flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[15px] font-bold text-paper tabular-nums"
          >
            {current
              ? `Question ${current.position} of ${questions.length}`
              : "Review"}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              aria-hidden="true"
              className={cn("transition-transform", !mapOpen && "rotate-180")}
            >
              <path
                d="m2 4 4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </button>
          <div className="flex justify-end gap-2">
            {view.kind === "review" ? (
              <Button
                onClick={() =>
                  go({ kind: "question", index: questions.length - 1 })
                }
              >
                Back
              </Button>
            ) : (
              <>
                {view.index > 0 ? (
                  <Button
                    onClick={() =>
                      go({ kind: "question", index: view.index - 1 })
                    }
                  >
                    Back
                  </Button>
                ) : null}
                <Button
                  onClick={() =>
                    go(
                      view.index < questions.length - 1
                        ? { kind: "question", index: view.index + 1 }
                        : { kind: "review" },
                    )
                  }
                >
                  Next
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function QuestionGrid({
  questions,
  responses,
  currentId,
  onPick,
}: {
  questions: Running["questions"];
  responses: Record<string, RunnerResponse>;
  currentId?: string;
  onPick: (index: number) => void;
}) {
  return (
    <>
      <div className="mb-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[13px] text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border-[1.5px] border-dashed border-ink-soft" />{" "}
          Unanswered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-pine" /> Answered
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="bookmark" size={14} className="text-pine" /> For review
        </span>
      </div>
      <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
        {questions.map((q, index) => {
          const r = responses[q.id];
          const answered = Boolean(r?.answer);
          return (
            <li key={q.id} className="relative">
              <button
                type="button"
                onClick={() => onPick(index)}
                aria-current={q.id === currentId ? "step" : undefined}
                aria-label={`Question ${q.position}${answered ? ", answered" : ", unanswered"}${r?.marked ? ", marked for review" : ""}`}
                className={cn(
                  "flex h-11 w-full items-center justify-center rounded-lg text-[15px] font-bold tabular-nums",
                  answered
                    ? "bg-pine text-pine-ink"
                    : "border-[1.5px] border-dashed border-ink-soft text-ink",
                  q.id === currentId &&
                    "ring-2 ring-ink ring-offset-2 ring-offset-paper",
                )}
              >
                {q.position}
              </button>
              {r?.marked ? (
                <Icon
                  name="bookmark"
                  size={15}
                  className="pointer-events-none absolute -right-1.5 -top-1.5 rounded-full bg-paper text-pine"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}

function ReviewPage({
  title,
  questions,
  responses,
  answeredCount,
  onPick,
  footer,
}: {
  title: string;
  questions: Running["questions"];
  responses: Record<string, RunnerResponse>;
  answeredCount: number;
  onPick: (index: number) => void;
  footer: ReactNode;
}) {
  const left = questions.length - answeredCount;
  return (
    <section className="mx-auto max-w-[720px] px-5 pt-10 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">
        Check your work
      </h1>
      <p className="mt-2 text-[17px] text-ink-soft">
        {left === 0
          ? "You answered every question. You can still go back to any of them."
          : `${left} question${left === 1 ? " is" : "s are"} unanswered. Unanswered questions count as wrong.`}
      </p>
      <div className="mt-8 rounded-card border border-hairline bg-paper p-6 text-left">
        <p className="mb-4 font-bold">{title}</p>
        <QuestionGrid
          questions={questions}
          responses={responses}
          onPick={onPick}
        />
      </div>
      <div className="mt-8">{footer}</div>
    </section>
  );
}

/** Typed answer box for Math "student-produced response" questions. */
function TypedAnswer({
  initial,
  onCommit,
}: {
  initial: string;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const timer = useRef<number | undefined>(undefined);
  return (
    <label className="flex max-w-xs flex-col gap-2">
      <span className="text-[15px] font-bold">Your answer</span>
      <input
        value={value}
        inputMode="decimal"
        maxLength={6}
        autoComplete="off"
        onChange={(e) => {
          const next = e.target.value.replace(/[^0-9./-]/g, "");
          setValue(next);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => onCommit(next), 600);
        }}
        onBlur={() => {
          window.clearTimeout(timer.current);
          onCommit(value);
        }}
        className="rounded-choice border-[1.5px] border-control bg-paper px-4 py-3 text-lg tabular-nums outline-none focus:border-pine"
      />
      <span className="text-[13px] text-graphite">
        Up to 5 characters for a positive answer, 6 for a negative one.
        Fractions like 3/4 are fine.
      </span>
    </label>
  );
}

function ToolButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[13px] font-semibold",
        pressed ? "bg-ink text-paper" : "hover:bg-paper",
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {children}
      </svg>
      <span className="hidden sm:block">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  );
}

const noopSubscribe = () => () => {};
