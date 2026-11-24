import { ThemeToggle } from "@/core/layout";
import { QuestionView } from "@/core/question";
import { AccentPanel, ButtonLink, EmptyState, Icon, Logo, LogoMark, Panel, PillSwitch } from "./ui";

const TOKENS = [
  { name: "paper", className: "bg-paper", use: "Page and panel background" },
  { name: "mist", className: "bg-mist", use: "Alternate sections" },
  { name: "canvas", className: "bg-canvas", use: "Behind the logged-in app" },
  { name: "ink", className: "bg-ink", use: "Main text" },
  { name: "graphite", className: "bg-graphite", use: "Secondary text" },
  { name: "hairline", className: "bg-hairline", use: "Dividers and borders" },
  { name: "pine", className: "bg-pine", use: "The only accent" },
  { name: "pine-soft", className: "bg-pine-soft", use: "Logo lower half, weakest area" },
];

const ICONS = ["dashboard", "tests", "topics", "calendar", "results", "bookmark", "moon", "sun"] as const;

/** /dev/design: every token and component in one place, in the current theme. */
export function StyleGuide() {
  return (
    <main className="min-h-dvh bg-canvas px-5 py-10">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[40px] font-extrabold tracking-tight">Design system</h1>
            <p className="mt-1 text-[17px] text-graphite">Use the button to check every piece in light and dark mode.</p>
          </div>
          <ThemeToggle />
        </header>

        <Panel>
          <h2 className="mb-5 text-xl font-extrabold">Colors</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {TOKENS.map((t) => (
              <div key={t.name}>
                <div className={`h-16 rounded-choice border border-hairline ${t.className}`} />
                <p className="mt-2 text-[15px] font-bold">{t.name}</p>
                <p className="text-[13px] text-graphite">{t.use}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="mb-5 text-xl font-extrabold">Type, Nunito</h2>
          <p className="text-[56px] font-extrabold leading-tight tracking-tight">Display 56</p>
          <p className="text-[40px] font-extrabold tracking-tight">Page title 40</p>
          <p className="text-[28px] font-extrabold tracking-tight">Panel title 28</p>
          <p className="text-xl font-extrabold">Section title 20</p>
          <p className="text-[17px]">Body 17. Questions and explanations use this size so long passages stay easy to read.</p>
          <p className="text-[15px] text-graphite">Small 15, secondary text</p>
          <p className="text-[13px] text-graphite">Caption 13</p>
        </Panel>

        <Panel>
          <h2 className="mb-5 text-xl font-extrabold">Buttons and switch</h2>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="#" size="lg">Primary</ButtonLink>
            <ButtonLink href="#" variant="quiet" size="lg">Quiet</ButtonLink>
            <ButtonLink href="#" size="sm">Small</ButtonLink>
            <ButtonLink href="#" variant="plain">Text link</ButtonLink>
          </div>
          <div className="mt-6">
            <PillSwitch
              label="Subject example"
              options={[
                { label: "English", href: "#", active: true },
                { label: "Math", href: "#", active: false },
              ]}
            />
          </div>
        </Panel>

        <div className="relative overflow-hidden rounded-panel bg-brand p-7 text-white">
          <h2 className="mb-5 text-xl font-extrabold">Glass on the brand green</h2>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="#" variant="onBrand" size="lg">On brand</ButtonLink>
            <ButtonLink href="#" variant="glassOnBrand" size="lg">Glass on brand</ButtonLink>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <AccentPanel>
            <p className="text-[15px] font-semibold opacity-75">Accent panel</p>
            <p className="mt-2 text-[28px] font-extrabold">One per page</p>
          </AccentPanel>
          <Panel>
            <p className="text-[15px] font-semibold text-graphite">Panel</p>
            <p className="mt-2 text-[28px] font-extrabold">Flat, hairline, no shadow</p>
          </Panel>
        </div>

        <EmptyState title="Empty state">Shown on pages that are planned but not built yet.</EmptyState>

        <Panel>
          <h2 className="mb-5 text-xl font-extrabold">Logo and icons</h2>
          <div className="flex flex-wrap items-end gap-6 text-ink">
            <LogoMark size={96} />
            <LogoMark size={48} />
            <LogoMark size={24} />
            <Logo size={34} wordmarkClassName="text-[21px]" />
          </div>
          <div className="mt-6 flex flex-wrap gap-5 text-ink-soft">
            {ICONS.map((name) => (
              <span key={name} className="flex flex-col items-center gap-1 text-[13px]">
                <Icon name={name} size={24} />
                {name}
              </span>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-5 text-xl font-extrabold">Question</h2>
          <div className="overflow-hidden rounded-card border border-hairline">
            <QuestionView number={4} correctId="B" question={SAMPLE_QUESTION} />
          </div>
        </Panel>
      </div>
    </main>
  );
}

const SAMPLE_QUESTION = {
  passage:
    "**Rainfall in Two Towns (mm)**\n\n| Month | Hillview | Lakeside |\n|---|---|---|\n| April | 61 | 48 |\n| May | 74 | 52 |\n\nIn *Field Notes*, a student compares two towns. <u>Hillview, the higher town, received more rain in both months</u>, a pattern the student calls ______.",
  prompt: "Which choice completes the text with the most logical and precise word?",
  choices: [
    { id: "A", text: "arbitrary" },
    { id: "B", text: "consistent" },
    { id: "C", text: "accidental" },
    { id: "D", text: "*temporary*" },
  ],
};

