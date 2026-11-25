"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import {
  DEFAULT_PRACTICE_SIZE,
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  MAX_PRACTICE_SIZE,
  PRACTICE_SIZES,
  rangeLabel,
  satPaceMinutes,
  satPaceSeconds,
  type CheckMode,
  type Difficulty,
} from "@/core/config/practice";
import type { SubjectSlug } from "@/core/config/subjects";
import { Button, cn } from "@/core/design/ui";
import { chunks, chunkStatus, itemsFor, levelCounts, suggestedStart, type TopicDetail } from "../schema";

type StartState = { message: string | null };
type Props = {
  topic: TopicDetail;
  subject: SubjectSlug;
  /** The practice feature's server action (passed in, so this file doesn't import another feature). */
  startAction: (prev: StartState, form: FormData) => Promise<StartState>;
};

/**
 * Choose what to practise: level, how many, which range (same order for every student),
 * check as you go or at the end, and an optional timer. The summary on the right always says
 * exactly what will start.
 */
export function TopicSetup({ topic, subject, startAction }: Props) {
  const counts = levelCounts(topic.items);
  const firstLevel = DIFFICULTIES.find((d) => counts[d] > 0) ?? "all";

  const [difficulty, setDifficulty] = useState<Difficulty>(firstLevel);
  const [size, setSize] = useState(DEFAULT_PRACTICE_SIZE);
  const [sizeText, setSizeText] = useState(String(DEFAULT_PRACTICE_SIZE));
  const [from, setFrom] = useState(() => suggestedStart(itemsFor(topic.items, firstLevel), DEFAULT_PRACTICE_SIZE));
  const [fromText, setFromText] = useState(() => String(from));
  const [checkMode, setCheckMode] = useState<CheckMode>("each");
  const [timed, setTimed] = useState(false);
  const [minutesText, setMinutesText] = useState<string | null>(null); // null = follow SAT pace
  const [state, action, pending] = useActionState(startAction, { message: null });

  const list = itemsFor(topic.items, difficulty);
  const total = list.length;
  const ranges = chunks(list, size);
  const safeFrom = Math.min(Math.max(1, from), Math.max(1, total));
  const count = Math.max(0, Math.min(size, total - safeFrom + 1));
  const to = safeFrom + count - 1;
  const answered = list.filter((i) => i.result !== null).length;
  const pace = satPaceMinutes(subject, Math.max(1, count));
  const minutes = minutesText ?? String(pace);
  const minutesOk = !timed || (/^\d+$/.test(minutes) && Number(minutes) >= 1 && Number(minutes) <= 300);
  const paceSeconds = satPaceSeconds(subject);

  const moveTo = (n: number) => {
    setFrom(n);
    setFromText(String(n));
  };
  const pickDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    moveTo(suggestedStart(itemsFor(topic.items, d), size));
  };
  const pickSize = (n: number, text = String(n)) => {
    const clean = Math.max(1, Math.min(MAX_PRACTICE_SIZE, Math.trunc(n) || 1));
    setSize(clean);
    setSizeText(text);
  };

  const levelWord = difficulty === "all" ? "" : `${DIFFICULTY_LABEL[difficulty].toLowerCase()} `;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-5">
        {topic.open.length > 0 ? (
          <Section title="Pick up where you left off">
            <ul className="-mx-2 divide-y divide-hairline">
              {topic.open.map((o) => (
                <li key={o.attemptId} className="flex flex-wrap items-center justify-between gap-3 px-2 py-3">
                  <div>
                    <p className="font-bold">{rangeLabel(o)}</p>
                    <p className="text-[14px] text-graphite">
                      {o.answered} of {o.total} answered,{" "}
                      {o.checkMode === "each" ? "checking as you go" : "checking at the end"}
                    </p>
                  </div>
                  <Link
                    href={`/practice/${o.attemptId}`}
                    className="rounded-full bg-wash px-4 py-2 text-sm font-bold hover:bg-hairline"
                  >
                    Continue
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section title="Difficulty">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="radiogroup" aria-label="Difficulty">
            {DIFFICULTIES.map((d) => (
              <Choice
                key={d}
                selected={difficulty === d}
                disabled={counts[d] === 0}
                onSelect={() => pickDifficulty(d)}
                title={DIFFICULTY_LABEL[d]}
                detail={`${counts[d]} question${counts[d] === 1 ? "" : "s"}`}
              />
            ))}
          </div>
        </Section>

        <Section
          title="Questions"
          aside={
            <span className="text-[14px] text-graphite tabular-nums">
              {answered} of {total} {levelWord}done
            </span>
          }
        >
          <div className="h-1.5 overflow-hidden rounded-full bg-mist" aria-hidden="true">
            <div className="h-full rounded-full bg-pine" style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Start at question #"
              value={fromText}
              min={1}
              max={Math.max(1, total)}
              onChange={(text) => {
                setFromText(text);
                const n = Math.trunc(Number(text));
                if (n >= 1) setFrom(n);
              }}
              hint={`1 to ${total}`}
            />
            <NumberField
              label="How many questions"
              value={sizeText}
              min={1}
              max={MAX_PRACTICE_SIZE}
              onChange={(text) => {
                const n = Math.trunc(Number(text));
                if (n >= 1) pickSize(n, text);
                else setSizeText(text);
              }}
              extra={
                <div className="flex gap-1.5">
                  {PRACTICE_SIZES.map((n) => (
                    <Pill key={n} selected={size === n && sizeText === String(n)} onClick={() => pickSize(n)}>
                      {n}
                    </Pill>
                  ))}
                  <Pill selected={size === total && sizeText === String(total)} onClick={() => pickSize(total)}>
                    All
                  </Pill>
                </div>
              }
            />
          </div>
          {count > 0 && count < size ? (
            <p className="mt-3 text-[14px] text-graphite">
              Only {count} question{count === 1 ? "" : "s"} left from #{safeFrom}, so you’ll do #{safeFrom}–{to}.
            </p>
          ) : null}

          <p className="mb-2.5 mt-6 text-[15px] font-bold">Or pick a group of {size}</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2">
            {ranges.map((r) => {
              const selected = r.from === safeFrom && count === r.size;
              return (
                <button
                  key={r.from}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => moveTo(r.from)}
                  className={cn(
                    "rounded-choice border-[1.5px] px-3.5 py-2.5 text-left transition-colors",
                    selected ? "border-pine bg-pine-tint" : "border-hairline bg-paper hover:border-control",
                  )}
                >
                  <span className="block font-bold tabular-nums">
                    #{r.from}–{r.to}
                  </span>
                  <span
                    className={cn(
                      "block text-[13px]",
                      r.answered === r.size ? "font-semibold text-pine" : "text-graphite",
                    )}
                  >
                    {chunkStatus(r)}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Summary: what will start */}
      <form action={action} className="lg:sticky lg:top-6">
        <input type="hidden" name="setId" value={topic.id} />
        <input type="hidden" name="difficulty" value={difficulty} />
        <input type="hidden" name="from" value={safeFrom} />
        <input type="hidden" name="count" value={count} />
        <input type="hidden" name="checkMode" value={checkMode} />
        <input type="hidden" name="minutes" value={timed ? minutes : ""} />

        <section className="rounded-panel border border-hairline bg-paper p-6">
          <div className="rounded-card bg-mist px-5 py-5 text-center">
            <p className="text-[14px] font-semibold text-graphite">You’ll do</p>
            <p className="mt-0.5 text-[40px] font-extrabold leading-tight tracking-tight tabular-nums">
              {count === 0 ? "Nothing yet" : safeFrom === to ? `#${safeFrom}` : `#${safeFrom}–${to}`}
            </p>
            <p className="text-[15px] text-ink-soft">
              {count} {levelWord}question{count === 1 ? "" : "s"}, in order
            </p>
          </div>

          <p className="mb-2.5 mt-6 text-[15px] font-bold">Answers</p>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="When to check answers">
            <Choice
              selected={checkMode === "each"}
              onSelect={() => setCheckMode("each")}
              title="Check as you go"
              detail="Press Check after each one."
            />
            <Choice
              selected={checkMode === "end"}
              onSelect={() => setCheckMode("end")}
              title="Check at the end"
              detail="Like the real test."
            />
          </div>

          <div className="mt-5 rounded-choice border-[1.5px] border-hairline px-4 py-3">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="font-bold">Timer</span>
              <input
                type="checkbox"
                checked={timed}
                onChange={(e) => setTimed(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="relative h-7 w-12 rounded-full bg-control transition-colors peer-checked:bg-pine peer-focus-visible:outline-2 peer-focus-visible:outline-pine after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-paper after:transition-transform peer-checked:after:translate-x-5"
              />
            </label>
            {timed ? (
              <div className="mt-3">
                <label className="flex items-center gap-2.5 text-[15px]">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={300}
                    value={minutes}
                    onChange={(e) => setMinutesText(e.target.value)}
                    className="w-20 rounded-choice border-[1.5px] border-control bg-paper px-3 py-1.5 tabular-nums outline-none focus:border-pine"
                  />
                  minutes
                </label>
                <p className="mt-1.5 text-[13px] text-graphite">
                  SAT pace: {Math.floor(paceSeconds / 60)} min {paceSeconds % 60} s a question
                  {minutesText !== null && minutesText !== String(pace) ? (
                    <>
                      {" "}
                      (
                      <button type="button" className="underline" onClick={() => setMinutesText(null)}>
                        use {pace} minutes
                      </button>
                      )
                    </>
                  ) : (
                    ""
                  )}
                  .
                </p>
              </div>
            ) : (
              <p className="mt-0.5 text-[13px] text-graphite">No time limit.</p>
            )}
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending || count === 0 || !minutesOk}>
            {pending ? "Starting…" : count === 0 ? "No questions here yet" : `Start ${safeFrom === to ? `#${safeFrom}` : `#${safeFrom}–${to}`}`}
          </Button>
          {state.message ? (
            <p role="alert" className="mt-3 text-center text-[14px] font-semibold">
              {state.message}
            </p>
          ) : null}
          <p className="mt-3 text-center text-[13px] text-graphite">Same order for everyone.</p>
        </section>
      </form>
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-panel border border-hairline bg-paper p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-[19px] font-extrabold tracking-tight">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** A selectable box with a bold title and a plain line under it (radio behaviour). */
function Choice({
  selected,
  disabled,
  onSelect,
  title,
  detail,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "rounded-choice border-[1.5px] px-4 py-3 text-left transition-colors disabled:opacity-40",
        selected ? "border-pine bg-pine-tint" : "border-hairline bg-paper enabled:hover:border-control",
      )}
    >
      <span className={cn("block font-bold", selected && "text-pine")}>{title}</span>
      <span className="block text-[13px] text-graphite">{detail}</span>
    </button>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  hint,
  extra,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  onChange: (text: string) => void;
  hint?: string;
  extra?: ReactNode;
}) {
  return (
    <div>
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-bold">{label}</span>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-choice border-[1.5px] border-control bg-paper px-4 py-2.5 text-lg font-bold tabular-nums outline-none focus:border-pine"
        />
      </label>
      {hint ? <p className="mt-1.5 text-[13px] text-graphite">{hint}</p> : null}
      {extra ? <div className="mt-2">{extra}</div> : null}
    </div>
  );
}

function Pill({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "min-w-14 rounded-full border-[1.5px] px-4 py-1.5 font-bold tabular-nums transition-colors",
        selected ? "border-pine bg-pine text-pine-ink" : "border-hairline bg-paper hover:border-control",
      )}
    >
      {children}
    </button>
  );
}
