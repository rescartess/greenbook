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
      aria-label="Preview of the GreenBook test screen"
      role="img"
      className="relative mx-auto max-w-[1080px] overflow-hidden rounded-card border border-hairline bg-paper md:h-[600px]"
    >
      <div className="flex flex-wrap pb-24 pt-20 md:pb-6">
        <div className="flex-[1_1_380px] border-hairline px-6 py-6 text-[17px] leading-[1.75] md:border-r md:px-10">
          <p className="mb-4">
            Desert ants forage far from their nests across sand that offers almost no landmarks. Researchers who
            lengthened some ants’ legs with tiny stilts found that those ants walked past their nests on the way home,
            while ants with shortened legs stopped short.
          </p>
          <p className="mb-4">
            The ants, it seems, judge distance by counting steps, a method that is ______ rather than based on what
            they see.
          </p>
          <p className="hidden text-graphite md:block">
            Later studies found that ants carried to a new spot before starting home still counted correctly, which
            suggests the count resets each time an ant leaves the nest and grows with every stride it takes across the
            open sand toward food.
          </p>
        </div>
        <div className="flex flex-[1_1_380px] flex-col gap-5 px-6 py-6 md:px-10">
          <div className="flex items-center gap-3.5 border-b border-dashed border-control pb-3.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-sm font-bold text-paper">4</span>
            <span className="text-sm text-ink-soft">Mark for review</span>
          </div>
          <p className="text-[17px] leading-relaxed">Which choice completes the text with the most logical and precise word?</p>
          <div className="flex flex-col gap-2.5">
            {CHOICES.map((c) => (
              <div
                key={c.letter}
                className={cn(
                  "flex items-center gap-3.5 rounded-choice px-4 py-3 text-base",
                  c.selected ? "border-2 border-pine bg-pine-tint" : "border-[1.5px] border-control bg-paper",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    c.selected ? "bg-pine text-pine-ink" : "border-[1.5px] border-ink",
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

      <div className="glass absolute inset-x-3.5 top-3.5 flex h-[54px] items-center justify-between gap-3 rounded-full px-5">
        <div className="text-[15px]">
          <span className="font-bold">Reading and Writing</span>{" "}
          <span className="hidden text-graphite sm:inline">Module 1</span>
        </div>
        <div className="text-lg font-bold tabular-nums">31:42</div>
        <div className="flex gap-4 text-sm text-ink-soft">
          <span>Annotate</span>
          <span className="hidden sm:inline">More</span>
        </div>
      </div>

      <div className="glass absolute inset-x-3.5 bottom-3.5 flex min-h-[60px] items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2.5">
        <span className="hidden text-sm text-graphite sm:inline">Aziza Karimova</span>
        <span className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Question 4 of 27</span>
        <div className="flex gap-2">
          <span className="rounded-full bg-wash px-5 py-2.5 text-sm font-semibold">Back</span>
          <span className="rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-pine-ink">Next</span>
        </div>
      </div>
    </div>
  );
}
