"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, cn } from "@/core/design/ui";
import {
  CheckYourWork,
  ClearHighlightsButton,
  CrossOutToggle,
  ExamBottomBar,
  ExamClock,
  ExamProblem,
  ExamTitle,
  ExamTopBar,
  GoToReviewButton,
  HighlightHint,
  HighlightTool,
  MapButton,
  MarkForReviewButton,
  MenuItem,
  ThemeMenuItem,
  ModuleOverScreen,
  MoreTool,
  QuestionMapGrid,
  QuestionMapPopover,
  QuestionView,
  ToolButton,
  TypedAnswer,
  useHighlights,
  useMounted,
  type MapItem,
} from "@/core/question";
import { abandonTest, finishModule, pauseTest, saveAnswer } from "../actions";
import { type RunnerResponse, type TestState } from "../schema";
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
  /** Where "Save and exit" and "Delete and exit" go. */
  exitHref: string;
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
  exitHref,
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
  const [finishing, setFinishing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [panel, setPanel] = useState<"calculator" | "reference" | null>(null);
  const [highlighting, setHighlighting] = useState(false);
  const [split, setSplit] = useState(50);
  const [moreOpen, setMoreOpen] = useState(false);
  const [exitStep, setExitStep] = useState<"menu" | "confirmDelete">("menu");
  const [exiting, setExiting] = useState<null | "save" | "delete">(null);

  const exit = async (how: "save" | "delete") => {
    setExiting(how);
    finishingRef.current = true; // stop the clock from finishing the module while we leave
    await queue.current;
    const result =
      how === "save"
        ? await pauseTest(amId)
        : await abandonTest(state.attemptId);
    if (!result.ok) {
      finishingRef.current = false;
      setExiting(null);
      setProblem(
        how === "save"
          ? "The test couldn’t be paused. Check your connection and try again."
          : "The test couldn’t be deleted. Try again.",
      );
      return;
    }
    router.replace(exitHref);
  };
  const mainRef = useRef<HTMLElement>(null);
  const mounted = useMounted();
  // ---- clock: the server's deadline, corrected for this computer's clock ----
  const [offset] = useState(
    () => new Date(module.serverNow).getTime() - Date.now(),
  );
  const deadline = module.deadlineAt
    ? new Date(module.deadlineAt).getTime()
    : null;
  const [now, setNow] = useState(() => Date.now() + offset);
  const remaining = deadline === null ? null : deadline - now;

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

  const highlights = useHighlights(
    `gb-marks-${amId}`,
    mainRef,
    current?.id ?? null,
    highlighting,
  );
  const mapItems: MapItem[] = questions.map((q) => ({
    id: q.id,
    number: q.position,
    state: responses[q.id]?.answer ? "answered" : "unanswered",
    marked: responses[q.id]?.marked ?? false,
  }));
  const pickById = (id: string) =>
    go({ kind: "question", index: questions.findIndex((q) => q.id === id) });

  const answeredCount = questions.filter((q) => responses[q.id]?.answer).length;
  const moduleLabel = `Module ${module.number}`;

  return (
    <div className="exam min-h-dvh bg-paper font-sans">
      <ExamTopBar
        left={
          <ExamTitle
            title={
              <>
                <span className="hidden sm:inline">Section {sectionNumber}, </span>
                {moduleLabel}
                <span className="hidden sm:inline">: {sectionName}</span>
              </>
            }
            directions={directions}
          />
        }
        center={<ExamClock remaining={remaining} mounted={mounted} />}
        right={
          <>
            {tools.includes("annotate") ? (
              <HighlightTool on={highlighting} onToggle={() => setHighlighting((h) => !h)} />
            ) : null}
            {tools.includes("calculator") && DESMOS_KEY ? (
              <ToolButton
                label="Calculator"
                pressed={panel === "calculator"}
                onClick={() => setPanel((p) => (p === "calculator" ? null : "calculator"))}
              >
                <path d="M6 3h12v18H6zM9 7h6M9 12h1M14 12h1M9 16h1M14 16h1" />
              </ToolButton>
            ) : null}
            {tools.includes("reference") ? (
              <ToolButton
                label="Reference"
                pressed={panel === "reference"}
                onClick={() => setPanel((p) => (p === "reference" ? null : "reference"))}
              >
                <path d="M5 4h10l4 4v12H5zM9 11h6M9 15h4M14 4v5h5" />
              </ToolButton>
            ) : null}
            <MoreTool
              open={moreOpen}
              onToggle={() => {
                setMoreOpen((o) => !o);
                setExitStep("menu");
              }}
            >
              {exitStep === "menu" ? (
                <>
                  <ThemeMenuItem />
                  <MenuItem
                    title={exiting === "save" ? "Saving…" : "Save and exit"}
                    detail="Your answers and time left are kept. The timer stops until you come back."
                    disabled={exiting !== null}
                    onClick={() => void exit("save")}
                  />
                  <MenuItem
                    title="Delete and exit"
                    detail="Throws this attempt away. It won’t count anywhere."
                    disabled={exiting !== null}
                    onClick={() => setExitStep("confirmDelete")}
                  />
                </>
              ) : (
                <div className="px-4 py-3">
                  <p className="font-bold">Delete this attempt?</p>
                  <p className="mt-1 text-[13px] text-graphite">
                    Your answers in this test will be lost. You can start the test again later.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="quiet" disabled={exiting !== null} onClick={() => setExitStep("menu")}>
                      Keep it
                    </Button>
                    <Button size="sm" disabled={exiting !== null} onClick={() => void exit("delete")}>
                      {exiting === "delete" ? "Deleting…" : "Delete and exit"}
                    </Button>
                  </div>
                </div>
              )}
            </MoreTool>
          </>
        }
      />

      <ExamProblem message={problem} />

      {/* Question or review page */}
      <main
        ref={mainRef}
        onMouseUp={highlights.addFromSelection}
        onTouchEnd={highlights.addFromSelection}
        className={cn("mx-auto max-w-[1600px] pb-28", highlighting && "[&_[data-passage]]:cursor-text")}
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
                      eliminated: out ? r.eliminated.filter((e) => e !== id) : [...r.eliminated, id],
                      answer: !out && r.answer === id ? null : r.answer,
                    });
                  }
                : undefined
            }
            passageWidth={split}
            onResize={setSplit}
            fillHeight
            headerExtra={
              <MarkForReviewButton
                marked={responses[current.id]?.marked ?? false}
                onToggle={() => update(current.id, { marked: !(responses[current.id]?.marked ?? false) })}
              />
            }
            headerRight={
              <>
                {mounted && highlights.marks[current.id]?.length ? (
                  <ClearHighlightsButton onClick={() => highlights.clear(current.id)} />
                ) : null}
                <CrossOutToggle on={crossOut} onToggle={() => setCrossOut((c) => !c)} />
              </>
            }
            answerSlot={
              current.type === "spr" ? (
                <TypedAnswer
                  key={current.id}
                  initial={responses[current.id]?.answer ?? ""}
                  onCommit={(value) => update(current.id, { answer: value || null })}
                />
              ) : undefined
            }
          />
        ) : (
          <CheckYourWork
            cardTitle={`Section ${sectionNumber}, ${moduleLabel}: ${sectionName} Questions`}
            items={mapItems}
            onPick={pickById}
            notes={
              <>
                <p>
                  {questions.length - answeredCount === 0
                    ? "You answered every question. You can still go back to any of them."
                    : `${questions.length - answeredCount} question${questions.length - answeredCount === 1 ? " is" : "s are"} unanswered. Unanswered questions count as wrong.`}
                </p>
                <p>
                  {module.isLast ? "Select " : "When you’re ready to move on, select "}
                  <strong>Next</strong>
                  {module.isLast ? " to finish the test." : ". You can’t come back to this module."}
                </p>
              </>
            }
          />
        )}
      </main>

      {mapOpen ? (
        <QuestionMapPopover
          title={`Section ${sectionNumber}, ${moduleLabel}: ${sectionName} Questions`}
          onClose={() => setMapOpen(false)}
          footer={
            <GoToReviewButton onClick={() => go({ kind: "review" })} />
          }
        >
          <QuestionMapGrid items={mapItems} currentId={current?.id} onPick={pickById} />
        </QuestionMapPopover>
      ) : null}

      {finishing ? (
        <ModuleOverScreen
          title={module.isLast ? "This Test Is Over" : "This Module Is Over"}
          next={module.isLast ? "Your results open in a moment." : "The next module starts in a moment."}
        />
      ) : null}
      {panel === "calculator" ? <Calculator onClose={() => setPanel(null)} /> : null}
      {panel === "reference" ? <ReferenceSheet onClose={() => setPanel(null)} /> : null}
      {highlighting ? <HighlightHint /> : null}

      <ExamBottomBar
        left={studentName}
        center={
          <MapButton
            label="Review"
            current={current?.position}
            total={current ? questions.length : undefined}
            open={mapOpen}
            onClick={() => setMapOpen((o) => !o)}
          />
        }
        right={
          view.kind === "review" ? (
            <>
              <Button onClick={() => go({ kind: "question", index: questions.length - 1 })}>Back</Button>
              <Button onClick={() => void finish()} disabled={finishing}>
                Next
              </Button>
            </>
          ) : (
            <>
              {view.index > 0 ? (
                <Button onClick={() => go({ kind: "question", index: view.index - 1 })}>Back</Button>
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
          )
        }
      />
    </div>
  );
}
