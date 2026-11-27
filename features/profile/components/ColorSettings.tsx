"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useDesign } from "@/core/design/theme";
import { cn } from "@/core/design/ui";
import {
  BACKGROUND_PRESETS,
  Btn,
  DesignPicker,
  DEFAULT_BACKGROUND,
  DEFAULT_MAIN,
  MAIN_PRESETS,
  USER_COLORS_STYLE_ID,
  userColorsCss,
  type UserColors,
} from "@/core/shell";
import { saveColors } from "../actions";

/** Shows the colors on every page at once, before they are saved. */
function preview(colors: UserColors) {
  let tag = document.getElementById(USER_COLORS_STYLE_ID);
  if (!tag) {
    tag = document.createElement("style");
    tag.id = USER_COLORS_STYLE_ID;
    document.head.appendChild(tag);
  }
  tag.textContent = userColorsCss(colors);
}

/**
 * Two colors, no more: 1 Main color (buttons, selected tabs, progress) and 2 Background (the page
 * behind the cards). Each has a few ready choices plus a picker for any color. The test and practice
 * screens keep their own colors.
 */
export function ColorSettings({ initial, compact = false }: { initial: UserColors; compact?: boolean }) {
  const [colors, setColors] = useState<UserColors>(initial);
  const [saved, setSaved] = useState<UserColors>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dirty = colors.main !== saved.main || colors.background !== saved.background;
  const savedRef = useRef(saved);
  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);
  // Leaving the page without saving puts the saved colors back.
  useEffect(() => () => preview(savedRef.current), []);

  const { design, setDesign } = useDesign();
  // Strawberry, Premium and Study are fixed; picking your own color moves you to Default.
  const pick = (next: UserColors) => {
    if (design !== "default" && (next.main || next.background)) setDesign("default");
    setColors(next);
    setMessage(null);
    preview(next);
  };
  const save = () =>
    start(async () => {
      const r = await saveColors(colors.main, colors.background);
      setMessage(r.message);
      if (r.ok) setSaved(colors);
    });

  return (
    <div className={compact ? "mt-4 grid gap-5" : "mt-5 grid gap-5 border-t border-hairline pt-5"}>
      <div className={compact ? "grid gap-5 md:grid-cols-2 md:gap-8" : "grid gap-5"}>
      <ColorRow
        step="1"
        title="Main color"
        detail="Buttons, selected tabs, progress bars and scores"
        presets={MAIN_PRESETS}
        fallback={DEFAULT_MAIN}
        value={colors.main}
        onPick={(main) => pick({ ...colors, main })}
      />
      <ColorRow
        step="2"
        title="Background"
        detail="The page behind the cards"
        presets={BACKGROUND_PRESETS}
        fallback={DEFAULT_BACKGROUND}
        value={colors.background}
        onPick={(background) => pick({ ...colors, background })}
      />
      </div>

      {compact ? null : (
        <>
      <div className="gb-colors rounded-[10px] border border-hairline bg-canvas p-3" aria-hidden="true">
        <div className="rounded-[8px] border border-hairline bg-paper p-3">
          <p className="text-[13px] font-semibold">Preview</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-mist">
            <div className="h-full w-3/5 rounded-full bg-pine" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex h-8 items-center rounded-[8px] bg-pine px-3 text-[13px] font-bold text-pine-ink">Start practice</span>
            <span className="rounded-[6px] bg-pine-tint px-2 py-0.5 text-[12px] font-semibold text-pine">Finished</span>
          </div>
        </div>
      </div>

      <p className="text-[13px] text-graphite">Used on every page except the test and practice screens, which keep the test-day look</p>

        </>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <Btn onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save colors"}
        </Btn>
        <Btn tone="quiet" disabled={pending || (!colors.main && !colors.background)} onClick={() => pick({ main: null, background: null })}>
          Reset colors
        </Btn>
        <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-hairline sm:block" />
        <DesignPicker variant="chips" />
        {message ? (
          <span role="status" className="text-[13px] font-semibold text-pine">
            {message}
          </span>
        ) : null}
      </div>
      {design !== "default" ? (
        <p className="-mt-2 text-[13px] text-graphite">Fixed design. Pick a color to go back to Default.</p>
      ) : null}
    </div>
  );
}

function ColorRow({
  step,
  title,
  detail,
  presets,
  fallback,
  value,
  onPick,
}: {
  step: string;
  title: string;
  detail: string;
  presets: readonly { name: string; hex: string | null }[];
  fallback: string;
  value: string | null;
  onPick: (hex: string | null) => void;
}) {
  const isPreset = presets.some((p) => p.hex === value);
  const current = presets.find((p) => p.hex === value)?.name ?? "Your color";
  return (
    <fieldset>
      <legend className="flex w-full items-baseline gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper">{step}</span>
        <span className="text-[15px] font-bold">{title}</span>
        <span className="ml-auto text-[13px] text-graphite">{current}</span>
      </legend>
      <p className="ml-7 text-[13px] text-graphite">{detail}</p>
      <div className="ml-7 mt-2.5 flex flex-wrap gap-2" role="radiogroup" aria-label={title}>
        {presets.map((p) => {
          const on = p.hex === value;
          return (
            <button
              key={p.name}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={p.name}
              title={p.name}
              onClick={() => onPick(p.hex)}
              style={{ backgroundColor: p.hex ?? fallback }}
              className={cn(
                "h-8 w-8 rounded-full border border-hairline transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine",
                on ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:ring-2 hover:ring-hairline",
              )}
            />
          );
        })}
        <label
          title="Pick any color"
          className={cn(
            "relative flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-hairline pl-1 pr-3 text-[13px] font-semibold text-ink-soft hover:bg-mist",
            !isPreset && value && "ring-2 ring-ink ring-offset-2 ring-offset-paper",
          )}
        >
          <span
            className="h-6 w-6 rounded-full border border-hairline"
            style={{ background: !isPreset && value ? value : "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
          />
          Custom
          <input
            type="color"
            value={value ?? fallback}
            onChange={(e) => onPick(e.target.value.toLowerCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`${title}: pick any color`}
          />
        </label>
      </div>
    </fieldset>
  );
}
