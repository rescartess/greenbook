import { cn } from "@/core/design/ui";

const CHOICES = [
  { letter: "A", text: "arbitrary" },
  { letter: "B", text: "internal", selected: true },
  { letter: "C", text: "visual" },
  { letter: "D", text: "accidental" },
];

/** A still picture of the test screen for the homepage (not the real test runner). */
export function TestScreenPreview() {
  return (
    <div
      aria-label="Preview of the FreedomPrep test screen"
      role="img"
      className="overflow-hidden rounded-[14px] border border-hairline bg-paper shadow-[0_8px_24px_rgb(0_0_0/0.06)]"
    >
      <div className="flex h-12 items-center justify-between gap-3 border-b border-dashed border-control bg-mist px-4 text-[13px]">
        <div className="min-w-0">
          <p className="truncate font-bold">Section 1, Module 1: Reading and Writing</p>
        </div>
        <p className="text-[16px] font-bold tabular-nums">31:42</p>
        <p className="hidden text-ink-soft sm:block">Highlight</p>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="border-hairline px-5 py-5 font-serif text-[15px] leading-[1.7] md:border-r">
          <p>
            Desert ants forage far from their nests across sand that offers almost no landmarks. Researchers who
            lengthened some ants’ legs with tiny stilts found that those ants walked past their nests on the way home,
            while ants with shortened legs stopped short.
          </p>
          <p className="mt-3">
            The ants, it seems, judge distance by counting steps, a method that is ______ rather than based on what
            they see.
          </p>
        </div>
        <div className="flex flex-col gap-3.5 px-5 py-5">
          <div className="flex items-center gap-3 border-b border-dashed border-control bg-mist px-2 py-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-ink text-[13px] font-bold text-paper">4</span>
            <span className="text-[13px] text-ink-soft">Mark for Review</span>
          </div>
          <p className="font-serif text-[15px] leading-relaxed">Which choice completes the text with the most logical and precise word?</p>
          <div className="flex flex-col gap-2">
            {CHOICES.map((c) => (
              <div
                key={c.letter}
                className={cn(
                  "flex items-center gap-3 rounded-[8px] px-3 py-2 font-serif text-[15px]",
                  c.selected ? "border-2 border-pine" : "border border-control",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-sans text-[12px] font-bold",
                    c.selected ? "bg-pine text-pine-ink" : "border border-ink",
                  )}
                >
                  {c.letter}
                </span>
                {c.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex h-14 items-center justify-between gap-3 border-t border-dashed border-control bg-mist px-4">
        <span className="hidden text-[13px] text-ink-soft sm:inline">Aziza Karimova</span>
        <span className="rounded-[8px] bg-ink px-3 py-1.5 text-[13px] font-semibold text-paper">Question 4 of 27</span>
        <div className="flex gap-2">
          <span className="rounded-[8px] bg-pine px-4 py-1.5 text-[13px] font-semibold text-pine-ink">Back</span>
          <span className="rounded-[8px] bg-pine px-4 py-1.5 text-[13px] font-semibold text-pine-ink">Next</span>
        </div>
      </div>
    </div>
  );
}
