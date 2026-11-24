"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/core/design/ui";

/** A floating glass panel on the right (full width on phones) for the calculator and the reference sheet. */
function SidePanel({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div
      role="dialog"
      aria-label={title}
      className={cn(
        "glass fixed inset-x-3 bottom-[88px] top-[78px] z-40 flex flex-col overflow-hidden rounded-card sm:left-auto sm:right-3",
        wide ? "sm:w-[480px]" : "sm:w-[400px]",
      )}
    >
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <p className="font-bold">{title}</p>
        <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm font-semibold hover:bg-wash">
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-paper">{children}</div>
    </div>
  );
}

const FORMULAS: { name: string; lines: string[] }[] = [
  { name: "Circle", lines: ["Area = πr²", "Circumference = 2πr"] },
  { name: "Rectangle", lines: ["Area = ℓw"] },
  { name: "Triangle", lines: ["Area = ½bh"] },
  { name: "Right triangle", lines: ["c² = a² + b²"] },
  { name: "Special right triangles", lines: ["30°-60°-90°: sides x, x√3, 2x", "45°-45°-90°: sides s, s, s√2"] },
  { name: "Rectangular box", lines: ["Volume = ℓwh"] },
  { name: "Cylinder", lines: ["Volume = πr²h"] },
  { name: "Sphere", lines: ["Volume = (4/3)πr³"] },
  { name: "Cone", lines: ["Volume = (1/3)πr²h"] },
  { name: "Pyramid", lines: ["Volume = (1/3)ℓwh"] },
];

export function ReferenceSheet({ onClose }: { onClose: () => void }) {
  return (
    <SidePanel title="Reference" onClose={onClose}>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-5 text-[15px] sm:grid-cols-2">
        {FORMULAS.map((f) => (
          <div key={f.name}>
            <dt className="font-bold">{f.name}</dt>
            {f.lines.map((l) => (
              <dd key={l} className="text-ink-soft">
                {l}
              </dd>
            ))}
          </div>
        ))}
      </dl>
      <div className="space-y-1.5 border-t border-hairline px-5 py-4 text-[15px] text-ink-soft">
        <p>A circle has 360 degrees, or 2π radians.</p>
        <p>The angles of a triangle add up to 180 degrees.</p>
      </div>
    </SidePanel>
  );
}

type DesmosCalculator = { destroy: () => void };
declare global {
  interface Window {
    Desmos?: { GraphingCalculator: (el: HTMLElement, options?: Record<string, unknown>) => DesmosCalculator };
  }
}

export const DESMOS_KEY = process.env.NEXT_PUBLIC_DESMOS_API_KEY ?? "";

/** The Desmos graphing calculator, loaded only when first opened. Needs NEXT_PUBLIC_DESMOS_API_KEY. */
export function Calculator({ onClose }: { onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let calc: DesmosCalculator | null = null;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !box.current || !window.Desmos) return;
      calc = window.Desmos.GraphingCalculator(box.current, { keypad: true, expressions: true, settingsMenu: false, zoomButtons: true });
    };
    if (window.Desmos) mount();
    else {
      const script = document.createElement("script");
      script.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${encodeURIComponent(DESMOS_KEY)}`;
      script.async = true;
      script.onload = mount;
      script.onerror = () => setFailed(true);
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
      calc?.destroy();
    };
  }, []);

  return (
    <SidePanel title="Calculator" onClose={onClose} wide>
      {failed ? (
        <p className="px-5 py-5 text-[15px]">The calculator couldn’t load. Check your connection and open it again.</p>
      ) : (
        <div ref={box} className="h-full min-h-[420px] w-full" />
      )}
    </SidePanel>
  );
}
