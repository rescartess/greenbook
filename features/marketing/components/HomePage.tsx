import Link from "next/link";
import { SQB_CREDIT } from "@/core/config/practice";
import { SUBJECTS, SUBJECT_SLUGS } from "@/core/config/subjects";
import { Logo } from "@/core/design/ui";
import { BerryStripe, BtnLink, Bubbles, DesignPicker, Sprinkles, Sticker, ThemeButton } from "@/core/shell";
import { BubbleField } from "./BubbleField";
import { Faq } from "./Faq";
import { Showcase } from "./Showcase";
import { SubjectShowcase } from "./SubjectShowcase";

/**
 * The first page visitors see (owner request 27 Nov 2026): premium, few words, short cold lines,
 * the product's own pieces as the pictures. Lessons from inter-nation.uz are in CLAUDE.md.
 */

/** Facts for the strip, all from core/config/subjects (nothing made up). */
function facts() {
  const all = SUBJECT_SLUGS.map((s) => SUBJECTS[s]);
  const questions = all.reduce((n, s) => n + s.modules * s.questionsPerModule, 0);
  const minutes = all.reduce((n, s) => n + s.modules * s.minutesPerModule, 0);
  return [
    { value: String(questions), label: "questions" },
    { value: `${Math.floor(minutes / 60)}h ${minutes % 60}m`, label: "on the clock" },
    { value: "400–1600", label: "the real scale" },
    { value: "0", label: "dollars" },
  ];
}

const NAV = [
  { href: "#designs", label: "Designs" },
  { href: "#inside", label: "Inside" },
  { href: "#faq", label: "FAQ" },
];

function Title({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[40px] font-extrabold leading-[1] tracking-[-0.045em] sm:text-[64px] ${className}`}>{children}</h2>;
}

function Tile({ title, line, className = "", children }: { title: string; line?: string; className?: string; children?: React.ReactNode }) {
  return (
    <article className={`rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper p-7 ${className}`}>
      <h3 className="text-[24px] font-extrabold tracking-[-0.03em]">{title}</h3>
      {line ? <p className="mt-1.5 text-[15px] text-graphite">{line}</p> : null}
      {children}
    </article>
  );
}

export function HomePage() {
  return (
    <div className="gb-colors fp-display relative min-h-dvh overflow-x-clip bg-canvas">
      <Sprinkles roomy />
      <BerryStripe />

      <header className="sticky top-3 z-40 px-3 sm:top-4 sm:px-6">
        <nav className="fp-glass mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 rounded-full border border-hairline pl-4 pr-2 sm:h-16 sm:pl-6">
          <Link href="/" className="text-ink">
            <Logo size={28} wordmarkClassName="text-[19px]" />
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="fp-label rounded-full px-3.5 py-2 text-[14px] font-semibold text-ink-soft transition-colors hover:bg-mist hover:text-ink">
                {n.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeButton />
            <Link href="/login" className="fp-label hidden rounded-full px-3.5 py-2 text-[14px] font-semibold text-ink-soft hover:text-ink sm:inline">
              Log in
            </Link>
            <BtnLink href="/login" className="h-10 sm:h-11">
              Start
            </BtnLink>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:pb-24">
        <BubbleField className="fp-bubble-mask pointer-events-none absolute inset-x-0 top-0 hidden justify-center opacity-40 md:flex" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div>
            <p className="fp-label inline-flex items-center gap-2 rounded-full border border-hairline bg-paper px-3.5 py-1.5 text-[13px] font-bold text-ink-soft">
              <span className="h-2 w-2 rounded-full bg-correct" aria-hidden="true" />
              Free. Obviously.
            </p>
            <h1 className="mt-6 text-[56px] font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-[88px]">
              Not another
              <br />
              <span className="fp-accent">prep site.</span>
            </h1>
            <p className="mt-6 max-w-[420px] text-[20px] leading-snug text-ink-soft">The real test. Your rules.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <BtnLink href="/login" className="h-12 px-7 text-[16px]">
                Start
                <Sticker emoji="🍓" size={18} tilt={0} />
              </BtnLink>
              <BtnLink href="#inside" tone="quiet" className="h-12 px-7 text-[16px]">
                Look inside
              </BtnLink>
            </div>
          </div>
          <div className="relative">
            <Sticker emoji="🍓" size={44} tilt={-18} bob className="absolute -left-6 -top-8 z-40" />
            <Sticker emoji="🌸" size={40} tilt={12} bob className="absolute -right-4 -bottom-6 z-40" style={{ animationDelay: "-1.6s" }} />
            <Showcase />
          </div>
        </div>

        <dl className="relative mx-auto mt-20 grid max-w-[1200px] grid-cols-2 gap-px overflow-hidden rounded-[var(--fp-r-card)] border border-hairline bg-hairline md:grid-cols-4">
          {facts().map((f) => (
            <div key={f.label} className="flex flex-col-reverse gap-1.5 bg-paper px-6 py-6">
              <dt className="text-[14px] text-graphite">{f.label}</dt>
              <dd className="whitespace-nowrap text-[24px] font-extrabold leading-none tracking-[-0.04em] tabular-nums sm:text-[44px]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Design dial */}
      <section id="designs" className="relative scroll-mt-24 px-3 sm:px-6">
        <div className="fp-dial mx-auto max-w-[1248px] overflow-hidden rounded-[28px] px-5 py-16 sm:px-10 sm:py-24">
          <div className="mx-auto max-w-[1100px]">
            <Title>
              Pick a mood.
              <br />
              <span className="opacity-60">Watch this page obey.</span>
            </Title>
            <DesignPicker className="fp-dial-picker mt-12 [&>legend]:sr-only [&>p]:sr-only" />
            <p className="mt-6 text-[15px] opacity-60">The test screen doesn’t care. It stays test day.</p>
          </div>
        </div>
      </section>

      {/* Inside */}
      <section id="inside" className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1200px]">
          <Title>
            Everything.
            <br />
            <span className="text-graphite">Nothing extra.</span>
          </Title>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <Tile title="It adapts." line="Module 1 decides Module 2." className="md:col-span-2">
              <div className="mt-8 flex items-center gap-4 sm:gap-6" aria-hidden="true">
                <div className="rounded-[12px] border border-hairline bg-mist px-5 py-5 text-[17px] font-bold">Module 1</div>
                <div className="relative h-24 w-10 shrink-0 sm:w-16">
                  <span className="absolute left-0 top-1/2 h-px w-1/2 bg-control" />
                  <span className="absolute bottom-3 left-1/2 top-3 w-px bg-control" />
                  <span className="absolute left-1/2 right-0 top-3 h-px bg-pine" />
                  <span className="absolute bottom-3 left-1/2 right-0 h-px bg-control" />
                </div>
                <div className="grid flex-1 gap-3">
                  <div className="rounded-[12px] border border-pine bg-pine-tint px-4 py-3 text-[15px] font-bold text-pine">Harder</div>
                  <div className="rounded-[12px] border border-hairline bg-mist px-4 py-3 text-[15px] font-bold">Easier</div>
                </div>
              </div>
            </Tile>

            <article className="fp-ink-card rounded-[var(--fp-r-card)] p-7 md:row-span-2">
              <h3 className="text-[24px] font-extrabold tracking-[-0.03em]">Mistakes don’t leave.</h3>
              <p className="mt-1.5 text-[15px] opacity-60">Until you’re right. Twice.</p>
              <ul className="mt-8 grid gap-3" aria-hidden="true">
                {[
                  { t: "Words in Context", d: 2 },
                  { t: "Transitions", d: 1 },
                  { t: "Linear equations", d: 1 },
                  { t: "Inferences", d: 0 },
                ].map((m) => (
                  <li key={m.t} className="flex items-center justify-between gap-3 rounded-[12px] border border-current/15 px-4 py-3">
                    <span className="text-[15px] font-semibold">{m.t}</span>
                    <span className="flex gap-1.5">
                      {[0, 1].map((i) => (
                        <span key={i} className={i < m.d ? "h-3 w-3 rounded-full bg-current" : "h-3 w-3 rounded-full border border-current/50"} />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <Tile title="One skill. On repeat.">
              <div className="mt-8">
                <Bubbles done={14} total={20} label="Example: 14 of 20 done" />
              </div>
            </Tile>

            <Tile title="Mark it up.">
              <p className="mt-6 font-serif text-[17px] leading-[1.8]" aria-hidden="true">
                Parks now plant <mark className="fp-hl rounded-[3px] bg-hl-yellow px-0.5">native grasses</mark> that{" "}
                <mark className="fp-hl rounded-[3px] bg-hl-blue px-0.5">need less water</mark> and{" "}
                <span className="underline decoration-2 underline-offset-4">stay green</span>.
              </p>
            </Tile>

            <Tile title="Make it yours." line="Photo. Bio. Colors." className="md:col-span-2">
              <div className="mt-6 flex flex-wrap items-center gap-3" aria-hidden="true">
                <span className="fp-avatar flex h-14 w-14 items-center justify-center rounded-full text-[18px] font-bold">AK</span>
                <span className="rounded-full border border-hairline bg-mist px-4 py-2 font-mono text-[14px]">Faster than the speed of light.</span>
              </div>
              <DesignPicker variant="chips" className="mt-5" />
            </Tile>

            <div>
              <SubjectShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative scroll-mt-24 border-t border-hairline px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Title>
            Asked.
            <br />
            <span className="text-graphite">Answered.</span>
          </Title>
          <Faq />
        </div>
      </section>

      {/* Closing */}
      <section className="relative px-3 pb-6 sm:px-6">
        <div className="fp-ink-card mx-auto flex max-w-[1248px] flex-col items-start justify-between gap-8 overflow-hidden rounded-[28px] px-6 py-16 sm:px-12 sm:py-24 lg:flex-row lg:items-end">
          <h2 className="text-[56px] font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-[96px]">Your move.</h2>
          <Link href="/login" className="fp-label inline-flex h-14 shrink-0 items-center rounded-[var(--fp-r-btn)] bg-paper px-8 text-[17px] font-bold text-ink transition-transform hover:-translate-y-0.5">
            Start
          </Link>
        </div>
      </section>

      <footer className="relative px-5 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-start justify-between gap-6 py-10 text-[13px] leading-normal text-graphite">
          <div className="max-w-[640px] space-y-1.5">
            <Logo size={24} wordmarkClassName="text-[16px]" />
            <p className="pt-2">SAT is a registered trademark of the College Board, which is not affiliated with FreedomPrep.</p>
            <p>SQB topics: {SQB_CREDIT}</p>
          </div>
          <p>
            © 2026 FreedomPrep<span className="rp-only"> · made with 🍓</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
