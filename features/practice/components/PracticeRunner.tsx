"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DIFFICULTY_LABEL } from "@/core/config/practice";
import { isSubjectSlug, SUBJECTS } from "@/core/config/subjects";
import { Button, cn } from "@/core/design/ui";
import {
  ClearHighlightsButton,
  CrossOutToggle,
  ExamBottomBar,
  ExamClock,
  ExamProblem,
  ExamTitle,
  ExamTopBar,
  HighlightHint,
  HighlightMenu,
  HighlightTool,
  MapButton,
  MarkForReviewButton,
  MenuItem,
  ThemeTool,
  FullscreenTool,
  MoreTool,
  QuestionMapGrid,
  QuestionMapPopover,
  CheckYourWork,
  GoToReviewButton,
  ModuleOverScreen,
  QuestionView,
  TypedAnswer,
  useHighlights,
  useMounted,
  type CheckFeedback,
  type MapItem,
} from "@/core/question";
import {
  abandonPractice,
  checkPracticeAnswer,
  finishPractice,
  pausePractice,
  savePracticeResponse,
} from "../actions";
import { rangeLabel, type PracticeState } from "../schema";
import { VerdictTag } from "@/core/question";

type Response = {
  answer: string | null;
  marked: boolean;
  eliminated: string[];
};
type View = { kind: "question"; index: number } | { kind: "review" };

type Props = {
  state: PracticeState;
  studentName: string;
  /** Highlighter for English. */
  canHighlight: boolean;
  /** Where "Save and exit" and "Delete and exit" go (the topic page). */
  exitHref: string;
};

const EMPTY: Response = { answer: null, marked: false, eliminated: [] };

/**
 * Practice on the Bluebook screen. Two ways to check answers, chosen before starting:
 * "each" shows a Check button for every question; "end" grades everything when the student finishes.
 * The server keeps the clock (if any) and the answers.
 */
export function PracticeRunner({
  state,
  studentName,
  canHighlight,
  exitHref,
}: Props) {
  const router = useRouter();
  const { questions, checkMode } = state;
  const amId = state.attemptModuleId;
  const checkEach = checkMode === "each";

  const [responses, setResponses] = useState<Record<string, Response>>(() =>
    Object.fromEntries(
      questions.map((q) => [
        q.id,
        {
          answer: q.feedback?.answer ?? q.answer,
          marked: q.marked,
          eliminated: q.eliminated,
        },
      ]),
    ),
  );
  const [feedback, setFeedback] = useState<
    Record<string, CheckFeedback | null>
  >(() => Object.fromEntries(questions.map((q) => [q.id, q.feedback])));
  const [view, setView] = useState<View>(() => {
    const open = questions.findIndex(
      (q) => !(q.feedback ?? (checkEach ? null : q.answer)),
    );
    return { kind: "question", index: open === -1 ? 0 : open };
  });
  const [mapOpen, setMapOpen] = useState(false);
  const [crossOut, setCrossOut] = useState(false);
  const [highlighting, setHighlighting] = useState(false);
  const [split, setSplit] = useState(50);
  const [problem, setProblem] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [exitStep, setExitStep] = useState<"menu" | "confirmDelete">("menu");
  const [exiting, setExiting] = useState<null | "save" | "delete">(null);
  const mainRef = useRef<HTMLElement>(null);
  const mounted = useMounted();

  const current = view.kind === "question" ? questions[view.index] : null;
  const highlights = useHighlights(
    `gb-marks-${amId}`,
    mainRef,
    current?.id ?? null,
    highlighting,
  );

  // ---- clock (only when the student chose a timer) ----
  const [offset] = useState(
    () => new Date(state.serverNow).getTime() - Date.now(),
  );
  const deadline = state.deadlineAt
    ? new Date(state.deadlineAt).getTime()
    : null;
  const [now, setNow] = useState(() => Date.now() + offset);
  const remaining = deadline === null ? null : deadline - now;

  // ---- saving: one at a time, in order, retried on network trouble ----
  const queue = useRef<Promise<void>>(Promise.resolve());
  const save = useCallback(
    (questionId: string, r: Response) => {
      queue.current = queue.current.then(async () => {
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            const result = await savePracticeResponse({
              attemptModuleId: amId,
              questionId,
              ...r,
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
          await new Promise((res) => setTimeout(res, 1000 * 2 ** attempt));
        }
      });
    },
    [amId, router],
  );

  const update = (questionId: string, change: Partial<Response>) => {
    const next = { ...(responses[questionId] ?? EMPTY), ...change };
    setResponses((all) => ({ ...all, [questionId]: next }));
    save(questionId, next);
  };

  const check = async () => {
    if (!current) return;
    const answer = responses[current.id]?.answer;
    if (!answer || feedback[current.id]) return;
    setChecking(true);
    await queue.current;
    const result = await checkPracticeAnswer(amId, current.id, answer).catch(
      () => null,
    );
    setChecking(false);
    if (!result) {
      setProblem(
        "That didn’t go through. Check your connection and try again.",
      );
      return;
    }
    if (!result.ok) {
      setProblem(result.message);
      if (result.reload) router.refresh();
      return;
    }
    setProblem(null);
    setFeedback((all) => ({ ...all, [current.id]: result.feedback }));
  };

  const go = (next: View) => {
    setMapOpen(false);
    setView(next);
    window.scrollTo({ top: 0 });
  };

  // ---- finishing (by the student, or because time ran out) ----
  const finishingRef = useRef(false);
  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    await queue.current;
    const result = await finishPractice(state.attemptId).catch(() => ({
      ok: false,
    }));
    if (!result.ok) {
      setProblem(
        "The practice couldn’t be finished. Check your connection and try again.",
      );
      finishingRef.current = false;
      setFinishing(false);
      return;
    }
    router.refresh();
  }, [router, state.attemptId]);

  const finishRef = useRef(finish);
  const lastTry = useRef(0);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);
  useEffect(() => {
    if (deadline === null) return;
    const id = window.setInterval(() => {
      const t = Date.now() + offset;
      setNow(t);
      if (t >= deadline && Date.now() - lastTry.current > 5000) {
        lastTry.current = Date.now();
        void finishRef.current();
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [offset, deadline]);

  const exit = async (how: "save" | "delete") => {
    setExiting(how);
    finishingRef.current = true; // keep the clock from finishing while we leave
    await queue.current;
    const result =
      how === "save"
        ? deadline === null
          ? { ok: true }
          : await pausePractice(amId).catch(() => ({ ok: false }))
        : await abandonPractice(state.attemptId).catch(() => ({ ok: false }));
    if (!result.ok) {
      finishingRef.current = false;
      setExiting(null);
      setProblem(
        how === "save"
          ? "The practice couldn’t be paused. Check your connection and try again."
          : "The practice couldn’t be deleted. Try again.",
      );
      return;
    }
    router.replace(exitHref);
  };

  // ---- the question map ----
  const mapItems: MapItem[] = questions.map((q, i) => {
    const f = feedback[q.id];
    return {
      id: q.id,
      number: i + 1,
      state: f
        ? f.isCorrect
          ? "correct"
          : "wrong"
        : responses[q.id]?.answer
          ? "answered"
          : "unanswered",
      marked: responses[q.id]?.marked ?? false,
    };
  });
  const pickById = (id: string) =>
    go({ kind: "question", index: questions.findIndex((q) => q.id === id) });
  const unanswered = questions.filter((q) => !responses[q.id]?.answer).length;
  const uncheckedPicks = checkEach
    ? questions.filter((q) => responses[q.id]?.answer && !feedback[q.id]).length
    : 0;

  const range = state.options ? rangeLabel(state.options) : null;
  const directions = [
    ...(isSubjectSlug(state.subject) ? SUBJECTS[state.subject].directions : []),
    checkEach
      ? "In this practice, pick an answer and then select Check to see if you’re right. Once checked, an answer can’t be changed."
      : "In this practice, your answers are checked when you finish, like the real test. You can change them until then.",
  ];

  const currentFeedback = current ? feedback[current.id] : null;
  const currentResponse = current ? (responses[current.id] ?? EMPTY) : EMPTY;

  return (
    <div className="exam min-h-dvh bg-paper font-sans">
      <ExamTopBar
        left={
          <ExamTitle
            title={
              <>
                {state.title}
                {state.options ? (
                  <span className="hidden font-semibold text-ink-soft sm:inline">
                    : {DIFFICULTY_LABEL[state.options.difficulty]}
                  </span>
                ) : null}
              </>
            }
            directions={directions}
          />
        }
        center={<ExamClock remaining={remaining} mounted={mounted} />}
        right={
          <>
            {canHighlight ? (
              <HighlightTool
                on={highlighting}
                onToggle={() => setHighlighting((h) => !h)}
              />
            ) : null}
            <FullscreenTool />
            <ThemeTool />
            <MoreTool
              open={moreOpen}
              onToggle={() => {
                setMoreOpen((o) => !o);
                setExitStep("menu");
              }}
            >
              {exitStep === "menu" ? (
                <>
                  <MenuItem
                    title={exiting === "save" ? "Saving…" : "Save and exit"}
                    detail={
                      deadline === null
                        ? "Your answers are kept. Continue from the topic page whenever you like."
                        : "Your answers and time left are kept. The timer stops until you come back."
                    }
                    disabled={exiting !== null}
                    onClick={() => void exit("save")}
                  />
                  <MenuItem
                    title="Delete and exit"
                    detail="Throws this practice away. Answers you already checked still count in Mistakes."
                    disabled={exiting !== null}
                    onClick={() => setExitStep("confirmDelete")}
                  />
                </>
              ) : (
                <div className="px-4 py-3">
                  <p className="font-bold">Delete this practice?</p>
                  <p className="mt-1 text-[13px] text-graphite">
                    You can start the same questions again later.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="quiet"
                      disabled={exiting !== null}
                      onClick={() => setExitStep("menu")}
                    >
                      Keep it
                    </Button>
                    <Button
                      size="sm"
                      disabled={exiting !== null}
                      onClick={() => void exit("delete")}
                    >
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

      <main
        ref={mainRef}
        onMouseUp={(e) => highlights.onPointerUp(e.clientX, e.clientY)}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0];
          if (t) highlights.onPointerUp(t.clientX, t.clientY);
        }}
        className={cn(
          "mx-auto max-w-[1600px] pb-28 min-[42rem]:pb-[79px]",
          highlighting && "[&_[data-passage]]:cursor-text",
        )}
      >
        {current && view.kind === "question" ? (
          <QuestionView
            key={current.id}
            number={view.index + 1}
            question={current}
            selectedId={currentResponse.answer}
            correctId={currentFeedback?.correctAnswer ?? null}
            eliminated={currentResponse.eliminated}
            onChoose={
              currentFeedback
                ? undefined
                : (id) =>
                    update(current.id, {
                      answer: id,
                      eliminated: currentResponse.eliminated.filter(
                        (e) => e !== id,
                      ),
                    })
            }
            onToggleEliminate={
              crossOut && !currentFeedback
                ? (id) => {
                    const out = currentResponse.eliminated.includes(id);
                    update(current.id, {
                      eliminated: out
                        ? currentResponse.eliminated.filter((e) => e !== id)
                        : [...currentResponse.eliminated, id],
                      answer:
                        !out && currentResponse.answer === id
                          ? null
                          : currentResponse.answer,
                    });
                  }
                : undefined
            }
            passageWidth={split}
            onResize={setSplit}
            fillHeight
            headerExtra={
              <MarkForReviewButton
                marked={currentResponse.marked}
                onToggle={() =>
                  update(current.id, { marked: !currentResponse.marked })
                }
              />
            }
            headerRight={
              <>
                {currentFeedback ? (
                  <VerdictTag
                    correct={currentFeedback.isCorrect}
                    className="mr-3"
                  />
                ) : null}
                {mounted && highlights.marks[current.id]?.length ? (
                  <ClearHighlightsButton
                    onClick={() => highlights.clear(current.id)}
                  />
                ) : null}
                {currentFeedback ? null : (
                  <CrossOutToggle
                    on={crossOut}
                    onToggle={() => setCrossOut((c) => !c)}
                  />
                )}
              </>
            }
            answerSlot={
              current.type === "spr" ? (
                <div className="flex flex-col gap-3">
                  <TypedAnswer
                    key={current.id}
                    initial={currentResponse.answer ?? ""}
                    disabled={Boolean(currentFeedback)}
                    onCommit={(value) =>
                      update(current.id, { answer: value || null })
                    }
                  />
                  {currentFeedback ? (
                    <p className="font-sans text-[15px]">
                      Correct answer:{" "}
                      <strong>{currentFeedback.correctAnswer}</strong>
                    </p>
                  ) : null}
                </div>
              ) : undefined
            }
          />
        ) : (
          <CheckYourWork
            cardTitle={`${state.title}${range ? `: ${range}` : ""}`}
            items={mapItems}
            onPick={pickById}
            notes={
              <>
                <p>
                  {unanswered === 0
                    ? "You answered every question. You can still go back to any of them."
                    : `${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered. Unanswered questions count as not correct.`}
                  {uncheckedPicks > 0
                    ? ` ${uncheckedPicks} answer${uncheckedPicks === 1 ? "" : "s"} you picked but didn’t check will be checked when you finish.`
                    : ""}
                </p>
                <p>
                  Select <strong>Next</strong> to finish and see your score.
                </p>
              </>
            }
          />
        )}
      </main>

      {mapOpen ? (
        <QuestionMapPopover
          title={range ? `${state.title}: ${range}` : state.title}
          onClose={() => setMapOpen(false)}
          footer={<GoToReviewButton onClick={() => go({ kind: "review" })} />}
        >
          <QuestionMapGrid
            items={mapItems}
            currentId={current?.id}
            onPick={pickById}
          />
        </QuestionMapPopover>
      ) : null}
      {highlighting ? <HighlightHint /> : null}
      {highlights.active ? (
        <HighlightMenu
          active={highlights.active}
          onColor={highlights.setActiveColor}
          onUnderline={highlights.toggleActiveUnderline}
          onDelete={highlights.removeActive}
        />
      ) : null}
      {finishing ? (
        <ModuleOverScreen
          title="Practice Complete"
          next="Your score opens in a moment."
        />
      ) : null}

      <ExamBottomBar
        left={studentName}
        center={
          <MapButton
            label="Review"
            current={
              current && view.kind === "question" ? view.index + 1 : undefined
            }
            total={
              current && view.kind === "question" ? questions.length : undefined
            }
            open={mapOpen}
            onClick={() => setMapOpen((o) => !o)}
          />
        }
        right={
          view.kind === "review" ? (
            <>
              <Button
                onClick={() =>
                  go({ kind: "question", index: questions.length - 1 })
                }
              >
                Back
              </Button>
              <Button onClick={() => void finish()} disabled={finishing}>
                Next
              </Button>
            </>
          ) : (
            <>
              {view.index > 0 ? (
                <Button
                  variant="quiet"
                  onClick={() =>
                    go({ kind: "question", index: view.index - 1 })
                  }
                >
                  Back
                </Button>
              ) : null}
              {checkEach && current && !currentFeedback ? (
                <Button
                  onClick={() => void check()}
                  disabled={!currentResponse.answer || checking}
                >
                  {checking ? "Checking…" : "Check"}
                </Button>
              ) : null}
              <Button
                variant={
                  checkEach && current && !currentFeedback ? "quiet" : "primary"
                }
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
