"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  DESMOS_API_KEY,
  DESMOS_API_VERSION,
  DESMOS_GRAPHING_OPTIONS,
  DESMOS_SCIENTIFIC_OPTIONS,
} from "@/core/config/desmos";
import { cn } from "@/core/design/ui";
import { RichLine } from "./RichText";
import { ToolButton } from "./ExamParts";

/*
 * Bluebook's Math tools, shared by the timed test and by practice (owner request 28 Nov 2026):
 * - Calculator: Desmos Graphing and Scientific in a full-height column on the left; the whole exam
 *   screen (bars included) moves right to make room, through the `--exam-left` CSS variable.
 *   Drag the dots to float it anywhere, drag the round handle to resize it, click it to expand.
 * - Reference: the formula sheet in a scrolling panel on the right; the arrows make it wider.
 * Both stay between the exam's top bar (87px) and bottom bar (79px).
 */
const TOP = 87;
const BOTTOM = 79;
const HEADER = "bg-[#151515] text-white";

/** True when the Desmos key is set; otherwise the Calculator button is hidden. */
export const CALCULATOR_AVAILABLE = DESMOS_API_KEY !== "";

// ---------------------------------------------------------------- top bar buttons

export function CalculatorTool({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <ToolButton label="Calculator" pressed={open} onClick={onToggle}>
      <rect x="6" y="2.5" width="12" height="19" rx="1.5" />
      <rect x="8.5" y="5" width="7" height="3.5" rx="0.5" />
      <path d="M9 12h.01M12 12h.01M15 12h.01M9 15h.01M12 15h.01M15 15h.01M9 18h.01M12 18h.01M15 18h.01" strokeWidth="2.2" />
    </ToolButton>
  );
}

export function ReferenceTool({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <ToolButton label="Reference" pressed={open} onClick={onToggle}>
      <text x="1.5" y="20" fill="currentColor" stroke="none" fontSize="21" fontStyle="italic" fontWeight="700" fontFamily="Georgia, serif">
        x
      </text>
      <text x="15" y="10.5" fill="currentColor" stroke="none" fontSize="11" fontWeight="700" fontFamily="Georgia, serif">
        2
      </text>
    </ToolButton>
  );
}

// ---------------------------------------------------------------- Desmos loading

type DesmosInstance = { destroy: () => void; resize: () => void };
type DesmosApi = {
  GraphingCalculator: (el: HTMLElement, options?: object) => DesmosInstance;
  ScientificCalculator: (el: HTMLElement, options?: object) => DesmosInstance;
};
declare global {
  interface Window {
    Desmos?: DesmosApi;
  }
}

let loading: Promise<DesmosApi> | null = null;

/** Loads Desmos's script once per page (only when the calculator is first opened). */
function loadDesmos(): Promise<DesmosApi> {
  if (window.Desmos) return Promise.resolve(window.Desmos);
  loading ??= new Promise<DesmosApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.desmos.com/api/${DESMOS_API_VERSION}/calculator.js?apiKey=${encodeURIComponent(DESMOS_API_KEY)}`;
    script.async = true;
    script.onload = () => (window.Desmos ? resolve(window.Desmos) : reject(new Error("Desmos missing")));
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Desmos didn’t load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** One Desmos calculator. Stays alive while hidden, so the student's work survives tab switches. */
function DesmosPane({ kind, visible, onFail }: { kind: "graphing" | "scientific"; visible: boolean; onFail: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const calc = useRef<DesmosInstance | null>(null);
  const failRef = useRef(onFail);
  useEffect(() => {
    failRef.current = onFail;
  }, [onFail]);

  useEffect(() => {
    let gone = false;
    loadDesmos().then(
      (api) => {
        if (gone || !box.current) return;
        calc.current =
          kind === "graphing"
            ? api.GraphingCalculator(box.current, { ...DESMOS_GRAPHING_OPTIONS })
            : api.ScientificCalculator(box.current, { ...DESMOS_SCIENTIFIC_OPTIONS });
      },
      () => {
        if (!gone) failRef.current();
      },
    );
    return () => {
      gone = true;
      calc.current?.destroy();
      calc.current = null;
    };
  }, [kind]);

  useEffect(() => {
    if (visible) calc.current?.resize();
  }, [visible]);

  return <div ref={box} aria-hidden={!visible} className={cn("absolute inset-0", !visible && "invisible")} />;
}

// ---------------------------------------------------------------- calculator panel

const wideQuery = "(min-width: 640px)";
function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(wideQuery);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(wideQuery).matches,
    () => true,
  );
}

type Box = { x: number; y: number; w: number; h: number };
const MIN_W = 320;
const MIN_H = 320;
const defaultWidth = () => Math.round(Math.min(520, Math.max(360, window.innerWidth * 0.33)));
const expandedWidth = () => Math.round(Math.min(960, Math.max(MIN_W, window.innerWidth * 0.62)));
const maxWidth = () => Math.round(window.innerWidth * 0.8);

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * The Desmos panel. Render it once the student first opens the calculator and keep it rendered
 * (with `open` false when closed) so their graphs and expressions stay until the module ends.
 */
export function CalculatorPanel({
  open,
  onClose,
  onDockChange,
}: {
  open: boolean;
  onClose: () => void;
  /** How many pixels the panel covers on the page's left edge (0 when floating, closed or on a phone). */
  onDockChange: (px: number) => void;
}) {
  const wide = useWide();
  const [tab, setTab] = useState<"graphing" | "scientific">("graphing");
  const [failed, setFailed] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  /** null = docked on the left; otherwise a floating window. */
  const [float, setFloat] = useState<Box | null>(null);
  const drag = useRef<{ kind: "move" | "size"; px: number; py: number; start: Box; fromDock: boolean; moved: boolean } | null>(null);

  const docked = float === null;
  useEffect(() => {
    onDockChange(open && wide && docked ? width : 0);
  }, [open, wide, docked, width, onDockChange]);
  useEffect(() => () => onDockChange(0), [onDockChange]);

  const current = (): Box => float ?? { x: 0, y: 0, w: width, h: window.innerHeight };

  const begin = (kind: "move" | "size", e: PointerEvent<HTMLElement>) => {
    if (!wide || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { kind, px: e.clientX, py: e.clientY, start: current(), fromDock: docked, moved: false };
  };
  const startMove = (e: PointerEvent<HTMLElement>) => begin("move", e);
  const startSize = (e: PointerEvent<HTMLElement>) => begin("size", e);
  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (!d.moved) return;
    const { start } = d;
    if (d.kind === "move") {
      // Leaving the dock: a window of a comfortable height instead of the full column.
      const h = d.fromDock ? Math.min(start.h, Math.max(MIN_H, window.innerHeight - 160)) : start.h;
      const y = clamp(start.y + dy, 0, Math.max(0, window.innerHeight - h));
      setFloat({ ...start, h, x: clamp(start.x + dx, 0, window.innerWidth - start.w), y });
    } else if (d.fromDock) {
      setWidth(clamp(start.w + dx, MIN_W, maxWidth()));
    } else {
      setFloat({
        ...start,
        w: clamp(start.w + dx, MIN_W, window.innerWidth - start.x),
        h: clamp(start.h + dy, MIN_H, window.innerHeight - start.y),
      });
    }
  };
  const end = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.kind === "move" && float && float.x < 24 && float.y < 40) {
      // Dropped back on the left edge: dock again.
      setWidth(float.w);
      setFloat(null);
    }
    if (d.kind === "size" && !d.moved) {
      // A click on the round handle expands the panel, or shrinks it back.
      const big = expandedWidth();
      if (docked) setWidth((w) => (w >= big - 20 ? defaultWidth() : big));
      else setFloat((f) => f && { ...f, w: f.w >= big - 20 ? defaultWidth() : Math.min(big, window.innerWidth - f.x) });
    }
  };

  const style = !wide
    ? { left: 0, right: 0, top: TOP, bottom: BOTTOM }
    : docked
      ? { left: 0, top: 0, bottom: 0, width }
      : { left: float.x, top: float.y, width: float.w, height: float.h };

  return (
    <section
      role="dialog"
      aria-label="Calculator"
      hidden={!open}
      style={style}
      className={cn(
        "fixed z-[35] flex flex-col bg-white font-sans text-[#111]",
        docked || !wide ? "border-r border-[#c8c8c8]" : "rounded-[8px] border border-[#9a9a9a] shadow-[0_12px_40px_rgb(0_0_0/0.28)]",
      )}
    >
      <header className={cn("flex h-[52px] shrink-0 items-center justify-between gap-2 px-3", HEADER, !docked && wide && "rounded-t-[7px]")}>
        <div role="tablist" aria-label="Calculator type" className="flex rounded-[8px] border-2 border-white/90 p-[2px]">
          {(
            [
              ["graphing", "Graphing", <path key="g" d="M3 19c3-9 6-11 8-6s5 4 10-8M3 3v18h18" />],
              ["scientific", "Scientific", <path key="s" d="M6 3h12v18H6zM8.5 6h7v3h-7zM9 13h.01M12 13h.01M15 13h.01M9 16.5h.01M12 16.5h.01M15 16.5h.01" />],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[15px] font-bold sm:text-[16px]",
                tab === id ? "bg-white text-[#111] underline underline-offset-4" : "text-white hover:bg-white/10",
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {icon}
              </svg>
              {label}
            </button>
          ))}
        </div>
        {wide ? (
          <button
            type="button"
            aria-label="Move the calculator"
            title="Drag to move"
            onPointerDown={startMove}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            className="grid cursor-move touch-none grid-cols-3 gap-[5px] rounded p-2 hover:bg-white/10"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="h-[5px] w-[5px] rounded-full bg-white" />
            ))}
          </button>
        ) : null}
        <button type="button" onClick={onClose} aria-label="Close the calculator" className="rounded p-1.5 hover:bg-white/10">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </header>

      <div className={cn("relative min-h-0 flex-1 overflow-hidden", !docked && wide && "rounded-b-[7px]")}>
        {failed ? (
          <p className="px-5 py-5 text-[15px]">The calculator couldn’t load. Check your connection, then close it and open it again.</p>
        ) : (
          <>
            <DesmosPane kind="graphing" visible={open && tab === "graphing"} onFail={() => setFailed(true)} />
            <DesmosPane kind="scientific" visible={open && tab === "scientific"} onFail={() => setFailed(true)} />
          </>
        )}
      </div>

      {wide ? (
        <>
          {/* The right edge resizes too, like a window border. */}
          <div
            aria-hidden="true"
            onPointerDown={startSize}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            className="absolute -right-1 top-[52px] bottom-12 w-2 cursor-ew-resize touch-none"
          />
          <button
            type="button"
            aria-label="Resize the calculator (click to expand or shrink)"
            title="Drag to resize, click to expand"
            onPointerDown={startSize}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            className={cn(
              "absolute bottom-3 -right-[18px] z-10 flex h-9 w-9 touch-none items-center justify-center rounded-full border border-[#8a8a8a] bg-white text-[#111] shadow-[0_2px_8px_rgb(0_0_0/0.25)] hover:bg-[#f2f2f2]",
              docked ? "cursor-ew-resize" : "cursor-nwse-resize",
            )}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12M6 6v6M6 6h6M18 18v-6M18 18h-6" />
            </svg>
          </button>
        </>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------- reference sheet

/** Letters on the drawings: italic serif, like math. */
function L({ x, y, children, anchor = "middle", upright }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; upright?: boolean }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill="currentColor" stroke="none" fontSize="15" fontStyle={upright ? "normal" : "italic"} fontFamily="'Noto Serif Variable', 'Noto Serif', Georgia, serif">
      {children}
    </text>
  );
}

/** √ with a bar over what follows it, drawn as text plus a line. */
function Root({ x, y, before = "", arg, anchor = "middle" }: { x: number; y: number; before?: string; arg: string; anchor?: "start" | "middle" }) {
  // Rough widths at 15px Noto Serif italic: letters ~8px, √ ~9px, digits ~8.5px.
  const width = before.length * 8 + 9 + arg.length * 8.5;
  const left = anchor === "middle" ? x - width / 2 : x;
  const barFrom = left + before.length * 8 + 8;
  return (
    <>
      <text x={left} y={y} fill="currentColor" stroke="none" fontSize="15" fontFamily="'Noto Serif Variable', 'Noto Serif', Georgia, serif">
        <tspan fontStyle="italic">{before}</tspan>
        <tspan>√</tspan>
        <tspan>{arg}</tspan>
      </text>
      <path d={`M${barFrom} ${y - 12.5}h${arg.length * 8.5 + 1}`} strokeWidth="1" />
    </>
  );
}

const RIGHT = (x: number, y: number, dx: number, dy: number) => (
  <path d={`M${x + dx} ${y}v${dy}h${-dx}`} strokeWidth="1" />
);

function Figure({ children, formulas, className, vb = "0 0 160 120" }: { children: ReactNode; formulas: string[]; className?: string; vb?: string }) {
  return (
    <figure className={cn("flex flex-col items-center", className)}>
      <svg viewBox={vb} className="h-auto w-full max-w-[180px] overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
      <figcaption className="mt-2 flex flex-col items-start gap-1 text-[17px] sm:text-[18px]">
        {formulas.map((f) => (
          <span key={f}>
            <RichLine source={`\\(${f}\\)`} />
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

const SHAPES = (
  <>
    <Figure formulas={["A = \\pi r^2", "C = 2\\pi r"]}>
      <circle cx="80" cy="60" r="46" />
      <circle cx="80" cy="60" r="3" fill="currentColor" />
      <path d="M80 60h46" />
      <L x={104} y={53}>r</L>
    </Figure>
    <Figure formulas={["A = \\ell w"]}>
      <rect x="22" y="32" width="116" height="62" />
      <L x={80} y={24}>ℓ</L>
      <L x={146} y={68} anchor="start">w</L>
    </Figure>
    <Figure formulas={["A = \\tfrac{1}{2}bh"]}>
      <path d="M12 100L62 14L142 100Z" />
      <path d="M62 14V100" strokeDasharray="4 3" strokeWidth="1" />
      {RIGHT(62, 100, 10, -10)}
      <L x={70} y={62} anchor="start">h</L>
      <L x={77} y={117}>b</L>
    </Figure>
    <Figure formulas={["c^2 = a^2 + b^2"]}>
      <path d="M30 14V100H140Z" />
      {RIGHT(30, 100, 10, -10)}
      <L x={20} y={62} anchor="end">b</L>
      <L x={85} y={117}>a</L>
      <L x={92} y={50} anchor="start">c</L>
    </Figure>
    <figure className="col-span-2 flex flex-col items-center">
      <div className="grid w-full grid-cols-2 items-end gap-6">
        <svg viewBox="0 0 170 120" className="h-auto w-full max-w-[190px] justify-self-center overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
          {/* 30-60-90: short side x, long side x√3, hypotenuse 2x. */}
          <path d="M10 96L148 96L148 16Z" />
          {RIGHT(148, 96, -10, -10)}
          <L x={70} y={48}>2x</L>
          <L x={156} y={60} anchor="start">x</L>
          <Root x={79} y={114} before="x" arg="3" />
          <path d="M44 96A34 34 0 0 0 39.4 79" strokeWidth="1" />
          <L x={49} y={91} anchor="start" upright>30°</L>
          <path d="M138 22a12 12 0 0 1 10 8" strokeWidth="1" />
          <L x={124} y={46} upright>60°</L>
        </svg>
        <svg viewBox="0 0 150 130" className="h-auto w-full max-w-[160px] justify-self-center overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
          {/* 45-45-90: legs s, hypotenuse s√2. */}
          <path d="M30 10V106H126Z" />
          {RIGHT(30, 106, 10, -10)}
          <L x={20} y={62} anchor="end">s</L>
          <L x={78} y={124}>s</L>
          <Root x={84} y={50} before="s" arg="2" anchor="start" />
          <L x={33} y={50} anchor="start" upright>45°</L>
          <L x={98} y={101} anchor="end" upright>45°</L>
        </svg>
      </div>
      <figcaption className="mt-3 text-[17px] font-bold sm:text-[18px]">Special Right Triangles</figcaption>
    </figure>
    <Figure formulas={["V = \\ell wh"]}>
      <path d="M16 44H106V96H16Z" />
      <path d="M16 44L42 22H132L106 44M132 22V74L106 96" />
      <L x={60} y={113}>ℓ</L>
      <L x={124} y={98} anchor="start">w</L>
      <L x={140} y={52} anchor="start">h</L>
    </Figure>
    <Figure formulas={["V = \\pi r^2 h"]}>
      <ellipse cx="74" cy="26" rx="52" ry="15" />
      <path d="M22 26V90M126 26V90M22 90a52 15 0 0 0 104 0" />
      <circle cx="74" cy="26" r="3" fill="currentColor" />
      <path d="M74 26L120 19" strokeWidth="1.2" />
      <L x={99} y={20}>r</L>
      <L x={134} y={63} anchor="start">h</L>
    </Figure>
    <Figure formulas={["V = \\tfrac{4}{3}\\pi r^3"]}>
      <circle cx="80" cy="60" r="48" />
      <path d="M32 60a48 15 0 0 0 96 0" />
      <path d="M32 60a48 15 0 0 1 96 0" strokeDasharray="4 3" strokeWidth="1" />
      <circle cx="80" cy="60" r="3" fill="currentColor" />
      <path d="M80 60h48" />
      <L x={100} y={57}>r</L>
    </Figure>
    <Figure formulas={["V = \\tfrac{1}{3}\\pi r^2 h"]}>
      <path d="M80 8L28 96M80 8L132 96M28 96a52 17 0 0 0 104 0" />
      <path d="M28 96a52 17 0 0 1 104 0" strokeDasharray="4 3" strokeWidth="1" />
      <path d="M80 8V96H132" strokeDasharray="4 3" strokeWidth="1" />
      {RIGHT(80, 96, 9, -9)}
      <L x={72} y={58} anchor="end">h</L>
      <L x={108} y={93}>r</L>
    </Figure>
    <Figure formulas={["V = \\tfrac{1}{3}\\ell wh"]}>
      <path d="M78 8L14 98H106L138 70ZM78 8L106 98" />
      <path d="M14 98L46 70H138M78 8L46 70M78 8V84" strokeDasharray="4 3" strokeWidth="1" />
      {RIGHT(78, 84, 8, -8)}
      <L x={58} y={114}>ℓ</L>
      <L x={128} y={92} anchor="start">w</L>
      <L x={72} y={52} anchor="end">h</L>
    </Figure>
  </>
);

/** The formula sheet (our own drawings and wording). */
export function ReferencePanel({ onClose }: { onClose: () => void }) {
  const [wide, setWide] = useState(false);
  return (
    <section
      role="dialog"
      aria-label="Reference"
      style={{ top: TOP, bottom: BOTTOM }}
      className={cn(
        "fixed right-0 z-[26] flex flex-col border-l border-control bg-paper text-ink shadow-[-10px_0_30px_rgb(0_0_0/0.14)] max-sm:left-0",
        wide ? "sm:w-[min(880px,calc(100vw-16px))]" : "sm:w-[min(500px,calc(100vw-16px))]",
      )}
    >
      <header className={cn("flex h-[52px] shrink-0 items-center justify-between px-5 font-sans", HEADER)}>
        <p className="text-[19px] font-bold">Reference</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWide((w) => !w)}
            aria-label={wide ? "Make the reference sheet narrower" : "Make the reference sheet wider"}
            className="hidden rounded p-1.5 hover:bg-white/10 sm:block"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {wide ? <path d="M4 20l6-6M10 14H5M10 14v5M20 4l-6 6M14 10h5M14 10V5" /> : <path d="M10 14l-6 6M4 20h5M4 20v-5M14 10l6-6M20 4h-5M20 4v5" />}
            </svg>
          </button>
          <button type="button" onClick={onClose} aria-label="Close the reference sheet" className="rounded p-1.5 hover:bg-white/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>
      </header>
      <div className="gb-scroll-visible min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-7 font-serif sm:px-8">
        <div className={cn("grid gap-x-8 gap-y-10", wide ? "sm:grid-cols-4 grid-cols-2" : "grid-cols-2")}>{SHAPES}</div>
        <div className="mt-10 space-y-6 text-[17px] leading-relaxed sm:text-[18px]">
          <p>A full circle measures 360 degrees of arc.</p>
          <p>
            A full circle measures <RichLine source="\(2\pi\)" /> radians of arc.
          </p>
          <p>The three angles of any triangle add up to 180 degrees.</p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- wiring for an exam screen

/**
 * Everything an exam screen needs for the Math tools: the top bar buttons, the panels, and the
 * style for the screen's root (moves the whole screen right while the calculator is docked).
 */
export function useMathTools({ calculator, reference }: { calculator: boolean; reference: boolean }) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcUsed, setCalcUsed] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [dock, setDock] = useState(0);
  const showCalc = calculator && CALCULATOR_AVAILABLE;

  const buttons = (
    <>
      {showCalc ? (
        <CalculatorTool
          open={calcOpen}
          onToggle={() => {
            setCalcUsed(true);
            setCalcOpen((o) => !o);
          }}
        />
      ) : null}
      {reference ? <ReferenceTool open={refOpen} onToggle={() => setRefOpen((o) => !o)} /> : null}
    </>
  );
  const panels = (
    <>
      {showCalc && calcUsed ? <CalculatorPanel open={calcOpen} onClose={() => setCalcOpen(false)} onDockChange={setDock} /> : null}
      {reference && refOpen ? <ReferencePanel onClose={() => setRefOpen(false)} /> : null}
    </>
  );
  const rootStyle = { "--exam-left": `${dock}px`, paddingLeft: dock || undefined } as CSSProperties;
  return { buttons, panels, rootStyle };
}
