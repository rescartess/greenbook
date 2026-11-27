"use client";

import { useActionState, useState, type ReactNode } from "react";
import {
  DEFAULT_PRACTICE_SIZE,
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  MAX_PRACTICE_SIZE,
  PRACTICE_SIZES,
  satPaceMinutes,
  type CheckMode,
  type Difficulty,
  numbersText,
} from "@/core/config/practice";
import type { SubjectSlug } from "@/core/config/subjects";
import { cn } from "@/core/design/ui";
import { Btn } from "@/core/shell";
import { itemsFor, levelCounts, suggestedStart, type TopicDetail } from "../schema";

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
  const [nameText, setNameText] = useState<string | null>(null); // null = follow the suggested name
  const [state, action, pending] = useActionState(startAction, { message: null });

  const list = itemsFor(topic.items, difficulty);
  const total = list.length;
  const safeFrom = Math.min(Math.max(1, from), Math.max(1, total));
  const count = Math.max(0, Math.min(size, total - safeFrom + 1));
  const to = safeFrom + count - 1;
  const answered = list.filter((i) => i.result !== null).length;
  const pace = satPaceMinutes(subject, Math.max(1, count));
  const minutes = minutesText ?? String(pace);
  const minutesOk = !timed || (/^\d+$/.test(minutes) && Number(minutes) >= 1 && Number(minutes) <= 300);

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
  const rangeText = count === 0 ? "" : safeFrom === to ? `${safeFrom}` : `${safeFrom}–${to}`;
  const suggestedName = `${topic.title}, ${difficulty === "all" ? "all levels" : DIFFICULTY_LABEL[difficulty].toLowerCase()} ${rangeText}`.trim().slice(0, 60);
  const name = nameText ?? suggestedName;
  const nameOk = name.trim().length > 0 && name.trim().length <= 60;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-5">
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
          <div className="h-1 overflow-hidden rounded-full bg-mist" aria-hidden="true">
            <div className="rp-rainbow-bar h-full rounded-full" style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Start at question"
              value={fromText}
              min={1}
              max={Math.max(1, total)}
              onChange={(text) => {
                setFromText(text);
                const n = Math.trunc(Number(text));
                if (n >= 1) setFrom(n);
              }}
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
              Only {count} question{count === 1 ? "" : "s"} left from question {safeFrom}, so you’ll do {numbersText(safeFrom, to)}.
            </p>
          ) : null}

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
        <input type="hidden" name="name" value={name} />

        <section className="rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper p-5 sm:p-6">
          <div className="rounded-[10px] bg-mist px-5 py-5 text-center">
            <p className="text-[34px] font-bold leading-tight tracking-[-0.01em] tabular-nums">
              {count === 0 ? "Nothing yet" : numbersText(safeFrom, to).replace(/^q/, "Q")}
            </p>
            {count > 0 && count <= 40 ? (
              <div
                role="img"
                aria-label={`${list.slice(safeFrom - 1, to).filter((i) => i.result !== null).length} of ${count} answered before`}
                className="mx-auto mt-4 grid w-fit grid-cols-[repeat(10,12px)] gap-x-2 gap-y-1.5"
              >
                {list.slice(safeFrom - 1, to).map((item, i) => (
                  <span
                    key={i}
                    className={cn("h-3 w-3 rounded-full", item.result !== null ? "bg-pine" : "border-[1.5px] border-graphite/45")}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <label htmlFor="practice-name" className="mb-2 mt-6 block text-[14px] font-semibold">
            Practice name
          </label>
          <input
            id="practice-name"
            value={name}
            maxLength={60}
            onChange={(e) => setNameText(e.target.value)}
            className="h-10 w-full rounded-[10px] border border-hairline bg-paper px-3 text-[15px] outline-none focus:border-pine"
          />

          <p className="mb-2.5 mt-6 text-[14px] font-semibold">Answers</p>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="When to check answers">
            <Choice
              selected={checkMode === "each"}
              onSelect={() => setCheckMode("each")}
              title="Check one by one"
            />
            <Choice
              selected={checkMode === "end"}
              onSelect={() => setCheckMode("end")}
              title="Check at the end"
            />
          </div>

          <div className="mt-5 rounded-[10px] border border-hairline px-4 py-3">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="font-semibold">Timer</span>
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
                    className="h-9 w-20 rounded-[8px] border border-hairline bg-paper px-3 tabular-nums outline-none focus:border-pine"
                  />
                  minutes
                </label>
              </div>
            ) : null}
          </div>

          <Btn type="submit" className="mt-6 h-11 w-full text-[16px]" disabled={pending || count === 0 || !minutesOk || !nameOk}>
            {pending ? "Starting…" : count === 0 ? "No questions here yet" : "Start practice"}
          </Btn>
          {state.message ? (
            <p role="alert" className="mt-3 text-center text-[14px] font-semibold">
              {state.message}
            </p>
          ) : null}
        </section>
      </form>
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper p-5 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold">{title}</h2>
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
  detail?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "rounded-[10px] border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-pine disabled:opacity-40",
        selected ? "border-pine bg-pine-tint ring-1 ring-pine ring-inset" : "border-hairline bg-paper enabled:hover:border-graphite/40",
      )}
    >
      <span className={cn("block font-semibold", selected && "text-pine")}>{title}</span>
      {detail ? <span className="block text-[13px] text-graphite">{detail}</span> : null}
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
        <span className="text-[14px] font-semibold">{label}</span>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-[10px] border border-hairline bg-paper px-4 text-[17px] font-semibold tabular-nums outline-none focus:border-pine"
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
        "h-8 min-w-12 rounded-[8px] border px-3 text-[14px] font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-pine",
        selected ? "border-pine bg-pine text-pine-ink" : "border-hairline bg-paper hover:border-graphite/40",
      )}
    >
      {children}
    </button>
  );
}
