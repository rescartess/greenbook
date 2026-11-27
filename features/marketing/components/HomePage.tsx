import Link from "next/link";
import { SQB_CREDIT } from "@/core/config/practice";
import { SUBJECTS, SUBJECT_SLUGS } from "@/core/config/subjects";
import { Logo } from "@/core/design/ui";
import { BerryStripe, BtnLink, Bubbles, DesignPicker, ScoreScale, Sprinkles, Sticker, ThemeButton } from "@/core/shell";
import { BubbleField } from "./BubbleField";
import { Faq } from "./Faq";
import { SubjectShowcase } from "./SubjectShowcase";
import { TryQuestion } from "./TryQuestion";

/** Facts for the strip under the headline, all from core/config/subjects (nothing made up). */
function facts() {
  const all = SUBJECT_SLUGS.map((s) => SUBJECTS[s]);
  const questions = all.reduce((n, s) => n + s.modules * s.questionsPerModule, 0);
  const minutes = all.reduce((n, s) => n + s.modules * s.minutesPerModule, 0);
  return [
    { value: String(questions), label: "questions in a full test" },
    { value: `${Math.floor(minutes / 60)}h ${minutes % 60}m`, label: "timed like test day" },
    { value: "400–1600", label: "the real score scale" },
    { value: "4", label: "designs to choose from" },
  ];
}

const NAV = [
  { href: "#try", label: "Try a question" },
  { href: "#designs", label: "Designs" },
  { href: "#inside", label: "What’s inside" },
  { href: "#faq", label: "Questions" },
];

/** Section heading: big, tight, sentence case. */
function Heading({ kicker, title, text }: { kicker: string; title: React.ReactNode; text?: string }) {
  return (
    <div className="max-w-[720px]">
      <p className="fp-label text-[14px] font-bold text-pine">{kicker}</p>
      <h2 className="mt-3 text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[52px]">{title}</h2>
      {text ? <p className="mt-4 text-[18px] leading-relaxed text-ink-soft">{text}</p> : null}
    </div>
  );
}

export function HomePage() {
  return (
    <div className="gb-colors fp-display relative min-h-dvh overflow-x-clip bg-canvas">
      <Sprinkles roomy />
      <BerryStripe />

      {/* Floating pill navigation */}
      <header className="sticky top-3 z-40 px-3 sm:top-4 sm:px-6">
        <nav className="fp-glass mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 rounded-full border border-hairline pl-4 pr-2 sm:h-16 sm:pl-6">
          <Link href="/" className="text-ink">
            <Logo size={28} wordmarkClassName="text-[19px]" />
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
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
              Start free
            </BtnLink>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:pb-28">
        <BubbleField className="fp-bubble-mask pointer-events-none absolute inset-x-0 top-0 hidden justify-center opacity-40 md:flex" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14">
          <div>
            <p className="fp-label inline-flex items-center gap-2 rounded-full border border-hairline bg-paper px-3.5 py-1.5 text-[13px] font-bold text-ink-soft">
              <span className="h-2 w-2 rounded-full bg-correct" aria-hidden="true" />
              Free SAT practice · English and Math
            </p>
            <h1 className="mt-6 text-[48px] font-extrabold leading-[0.98] tracking-[-0.045em] sm:text-[76px]">
              Test day stays test day.{" "}
              <span className="fp-accent">The rest is yours.</span>
            </h1>
            <p className="mt-6 max-w-[500px] text-[19px] leading-relaxed text-ink-soft">
              A test screen true to Bluebook, and a site around it you can dress in four designs. Free for every student.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <BtnLink href="/login" className="h-12 px-6 text-[16px]">
                Create free account
                <Sticker emoji="🍓" size={18} tilt={0} />
              </BtnLink>
              <BtnLink href="#try" tone="quiet" className="h-12 px-6 text-[16px]">
                Try a question
              </BtnLink>
            </div>
          </div>
          <div className="relative">
            <Sticker emoji="🍓" size={44} tilt={-18} bob className="absolute -left-7 -top-9 z-10" />
            <Sticker emoji="🌸" size={40} tilt={12} bob className="absolute -right-3 -top-6 z-10" style={{ animationDelay: "-1.6s" }} />
            <TryQuestion />
          </div>
        </div>

        <dl className="relative mx-auto mt-16 grid max-w-[1200px] grid-cols-2 gap-px overflow-hidden rounded-[var(--fp-r-card)] border border-hairline bg-hairline md:grid-cols-4">
          {facts().map((f) => (
            <div key={f.label} className="flex flex-col-reverse gap-1 bg-paper px-6 py-6">
              <dt className="text-[14px] text-graphite">{f.label}</dt>
              <dd className="text-[28px] font-extrabold leading-none tracking-[-0.03em] tabular-nums sm:text-[40px]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Design dial: the page changes as you pick */}
      <section id="designs" className="relative scroll-mt-24 px-3 sm:px-6">
        <div className="fp-dial mx-auto max-w-[1248px] overflow-hidden rounded-[28px] px-5 py-14 sm:px-10 sm:py-20">
          <div className="mx-auto max-w-[1100px]">
            <p className="fp-label text-[14px] font-bold opacity-70">Freedom of design</p>
            <h2 className="mt-3 max-w-[760px] text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[56px]">
              One test screen. Four ways to live around it.
            </h2>
            <p className="mt-4 max-w-[560px] text-[18px] leading-relaxed opacity-75">
              Pick one below and watch this page change. Your dashboard, topics and results follow. The test screen never does.
            </p>
            <DesignPicker className="fp-dial-picker mt-10 [&>legend]:sr-only [&>p]:sr-only" />
          </div>
        </div>
      </section>

      {/* What's inside: real pieces of the product, not pictures of it */}
      <section id="inside" className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1200px]">
          <Heading kicker="What’s inside" title="Everything you need. Nothing you don’t." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <article className="rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper p-7 md:col-span-2">
              <h3 className="text-[22px] font-extrabold tracking-[-0.02em]">Adaptive, like the real thing</h3>
              <p className="mt-2 max-w-[460px] text-[16px] text-ink-soft">How you do in Module 1 decides whether Module 2 gets easier or harder.</p>
              <div className="mt-8 flex items-center gap-4 sm:gap-6" aria-hidden="true">
                <div className="rounded-[12px] border border-hairline bg-mist px-4 py-5 text-center">
                  <p className="text-[13px] text-graphite">Module 1</p>
                  <p className="mt-1 text-[17px] font-bold">All levels</p>
                </div>
                <div className="relative h-24 w-10 shrink-0 sm:w-16">
                  <span className="absolute left-0 top-1/2 h-px w-1/2 bg-control" />
                  <span className="absolute left-1/2 top-3 bottom-3 w-px bg-control" />
                  <span className="absolute left-1/2 right-0 top-3 h-px bg-pine" />
                  <span className="absolute left-1/2 right-0 bottom-3 h-px bg-control" />
                </div>
                <div className="grid flex-1 gap-3">
                  <div className="rounded-[12px] border border-pine bg-pine-tint px-4 py-3">
                    <p className="text-[15px] font-bold text-pine">Harder Module 2</p>
                    <p className="text-[13px] text-ink-soft">Room to reach the top scores</p>
                  </div>
                  <div className="rounded-[12px] border border-hairline bg-mist px-4 py-3">
                    <p className="text-[15px] font-bold">Easier Module 2</p>
                    <p className="text-[13px] text-ink-soft">A lower ceiling, like on test day</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="fp-ink-card rounded-[var(--fp-r-card)] p-7 md:row-span-2">
              <h3 className="text-[22px] font-extrabold tracking-[-0.02em]">Mistakes come back</h3>
              <p className="mt-2 text-[16px] opacity-75">Every question you miss waits for you until you get it right twice.</p>
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
              <p className="mt-5 text-[13px] opacity-60">Filled: answered right</p>
            </article>

            <article className="rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper p-7">
              <h3 className="text-[22px] font-extrabold tracking-[-0.02em]">Scored on the real scale</h3>
              <p className="mt-2 text-[16px] text-ink-soft">Each subject from 200 to 800</p>
              <div className="mt-8">
                <ScoreScale value={640} earlier={580} />
                <p className="mt-3 text-[13px] text-graphite">Example: 580 last time, 640 now</p>
              </div>
            </article>

            <article className="rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper p-7">
              <h3 className="text-[22px] font-extrabold tracking-[-0.02em]">One skill at a time</h3>
              <p className="mt-2 text-[16px] text-ink-soft">Drill a single topic, from transitions to circle equations</p>
              <div className="mt-8">
                <Bubbles done={14} total={20} label="Example: 14 of 20 done" />
                <p className="mt-3 text-[13px] text-graphite">Every bubble is a question</p>
              </div>
            </article>

            <article className="rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper p-7 md:col-span-2">
              <h3 className="text-[22px] font-extrabold tracking-[-0.02em]">Highlight like on test day</h3>
              <p className="mt-2 text-[16px] text-ink-soft">Three colors and underline, right in the passage</p>
              <p className="mt-6 max-w-[620px] font-serif text-[17px] leading-[1.8]" aria-hidden="true">
                Many city parks now plant <mark className="fp-hl rounded-[3px] bg-hl-yellow px-0.5">native grasses</mark> instead of lawns. The
                grasses <mark className="fp-hl rounded-[3px] bg-hl-blue px-0.5">need less water</mark>, give shelter to insects and birds, and{" "}
                <span className="underline decoration-2 underline-offset-4">stay green through dry summers</span>, so visitors{" "}
                <mark className="fp-hl rounded-[3px] bg-hl-pink px-0.5">see more butterflies</mark> every year.
              </p>
            </article>

            <article className="md:col-span-1">
              <SubjectShowcase />
            </article>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section id="faq" className="relative scroll-mt-24 border-t border-hairline px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Heading kicker="Questions" title="Before you start" text="Short answers to what students ask first." />
          <Faq />
        </div>
      </section>

      {/* Closing call */}
      <section className="relative px-3 pb-6 sm:px-6">
        <div className="fp-ink-card mx-auto flex max-w-[1248px] flex-col items-start justify-between gap-8 overflow-hidden rounded-[28px] px-6 py-14 sm:px-12 sm:py-20 lg:flex-row lg:items-end">
          <h2 className="max-w-[760px] text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[64px]">
            Your first full test is one click away
          </h2>
          <Link href="/login" className="fp-label inline-flex h-14 shrink-0 items-center rounded-[var(--fp-r-btn)] bg-paper px-7 text-[17px] font-bold text-ink transition-transform hover:-translate-y-0.5">
            Create free account
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
