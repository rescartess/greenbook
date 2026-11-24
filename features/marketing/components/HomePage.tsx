import Link from "next/link";
import { ButtonLink, Logo } from "@/core/design/ui";
import { SubjectShowcase } from "./SubjectShowcase";
import { TestScreenPreview } from "./TestScreenPreview";

const WAYS = [
  { name: "Full tests", text: "Two adaptive modules, timed like test day, scored from 200 to 800." },
  { name: "By topic", text: "Pick one skill, from transitions to circle equations, and drill only that." },
  { name: "By month", text: "Each month’s question set in one place, newest first." },
  { name: "Your mistakes", text: "Every question you miss waits here until you get it right twice." },
];

const STAR =
  "M100 38 L115.3 85 L164.7 85 L124.7 114 L140 161 L100 132 L60 161 L75.3 114 L35.3 85 L84.7 85 Z";

function HeroStar() {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className="pointer-events-none absolute -right-40 -top-24 h-[520px] w-[520px] text-brand-up md:h-[720px] md:w-[720px]"
    >
      <defs>
        <clipPath id="hero-up">
          <path d="M0 0 L200 0 L200 48.75 L0 161.25 Z" />
        </clipPath>
        <clipPath id="hero-down">
          <path d="M0 161.25 L200 48.75 L200 200 L0 200 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#hero-up)">
        <path transform="translate(1.5 -4.5)" d={STAR} fill="currentColor" />
      </g>
      <g clipPath="url(#hero-down)" className="text-brand-down">
        <path d={STAR} fill="currentColor" />
      </g>
    </svg>
  );
}

export function HomePage() {
  return (
    <div className="bg-paper">
      <section className="relative overflow-hidden bg-brand px-5 pb-36 pt-5 text-white">
        <HeroStar />
        <nav className="glass-on-brand relative mx-auto flex h-14 max-w-[980px] items-center justify-between gap-3 rounded-full pl-[18px] pr-2">
          <Link href="/" className="text-white">
            <Logo size={26} variant="onBrand" wordmarkClassName="text-lg" />
          </Link>
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Link href="/login" className="hidden whitespace-nowrap rounded-full px-4 py-2.5 text-white sm:inline-flex">
              Log in
            </Link>
            <ButtonLink href="/login" variant="onBrand" size="sm">
              Create account
            </ButtonLink>
          </div>
        </nav>

        <div className="relative mx-auto max-w-[940px] pt-24 text-center md:pt-32">
          <h1 className="text-[44px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-[88px]">
            Practice the SAT the way you’ll take it.
          </h1>
          <p className="mx-auto mt-7 max-w-[600px] text-[21px] leading-[1.45] text-white/80">
            Adaptive full tests, practice by topic and every mistake saved. Free for every student.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <ButtonLink href="/login" variant="onBrand" size="lg">
              Create free account
            </ButtonLink>
            <ButtonLink href="/login" variant="glassOnBrand" size="lg">
              Log in
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="bg-mist px-5 pb-16">
        <div className="relative -mt-[72px]">
          <TestScreenPreview />
        </div>
        <p className="mx-auto mt-7 max-w-[640px] text-center text-[15px] leading-normal text-graphite">
          The same timer, navigator, mark for review and answer cross-out you’ll see on test day. The controls float on
          glass, so the question always has the whole screen.
        </p>
      </section>

      <section className="bg-mist px-5 pb-28 pt-4 text-center">
        <h2 className="mx-auto max-w-[820px] text-4xl font-extrabold leading-[1.06] tracking-[-0.025em] sm:text-[56px]">
          One switch between English and Math.
        </h2>
        <p className="mx-auto mt-5 max-w-[560px] text-[19px] leading-normal text-graphite">
          Your page stays where it is. Only the questions change.
        </p>
        <SubjectShowcase />
      </section>

      <section className="px-5 py-28">
        <div className="mx-auto max-w-[880px]">
          <h2 className="mb-12 text-4xl font-extrabold leading-[1.06] tracking-[-0.025em] sm:text-[56px]">
            Four ways to practice.
          </h2>
          <ul className="border-b border-hairline">
            {WAYS.map((w) => (
              <li key={w.name} className="flex flex-wrap gap-x-8 gap-y-2 border-t border-hairline py-7">
                <h3 className="flex-[1_1_220px] text-[22px] font-bold tracking-[-0.015em]">{w.name}</h3>
                <p className="flex-[999_1_320px] text-[17px] leading-relaxed text-ink-soft">{w.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-brand px-5 py-32 text-center text-white">
        <h2 className="mx-auto max-w-[820px] text-4xl font-extrabold leading-[1.06] tracking-[-0.025em] sm:text-[56px]">
          Start with one full test.
        </h2>
        <p className="mx-auto mt-5 max-w-[520px] text-[19px] leading-normal text-white/80">
          It takes about an hour and shows you exactly where to focus.
        </p>
        <ButtonLink href="/login" variant="onBrand" size="lg" className="mt-10">
          Create free account
        </ButtonLink>
      </section>

      <footer className="mx-auto flex max-w-[1080px] flex-wrap justify-between gap-3 px-5 pb-10 pt-7 text-[13px] leading-normal text-graphite">
        <p className="max-w-[620px]">
          SAT is a registered trademark of the College Board, which is not affiliated with GreenBook. All practice
          questions are original.
        </p>
        <p>© 2026 GreenBook</p>
      </footer>
    </div>
  );
}
