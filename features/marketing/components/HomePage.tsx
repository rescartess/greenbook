import Link from "next/link";
import { SQB_CREDIT } from "@/core/config/practice";
import { Logo } from "@/core/design/ui";
import { BtnLink, ThemeButton } from "@/core/shell";
import { SubjectShowcase } from "./SubjectShowcase";
import { TestScreenPreview } from "./TestScreenPreview";

const WAYS = [
  { name: "Full tests", text: "Two adaptive modules, timed like test day, scored from 200 to 800." },
  { name: "By topic", text: "Pick one skill, from transitions to circle equations, and drill only that." },
  { name: "Your mistakes", text: "Every question you miss waits here until you get it right twice." },
];

export function HomePage() {
  return (
    <div className="gb-colors min-h-dvh bg-canvas">
      <header className="border-b border-hairline bg-paper">
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-5 sm:px-8">
          <Link href="/" className="text-ink">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeButton />
            <Link href="/login" className="hidden text-[15px] font-semibold text-ink-soft hover:text-ink sm:inline">
              Log in
            </Link>
            <BtnLink href="/login">Create account</BtnLink>
          </div>
        </nav>
      </header>

      <section className="bg-paper px-5 pb-16 pt-14 sm:px-8 lg:pb-24 lg:pt-20">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="max-w-[520px]">
            <h1 className="text-[40px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[52px]">
              Practice the SAT the way you’ll take it
            </h1>
            <p className="mt-5 text-[18px] leading-relaxed text-ink-soft">
              Adaptive full tests, practice by topic and every mistake saved. Free for every student.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <BtnLink href="/login" className="h-11 px-5 text-[16px]">
                Create free account
              </BtnLink>
              <BtnLink href="/login" tone="quiet" className="h-11 px-5 text-[16px]">
                Log in
              </BtnLink>
            </div>
          </div>
          <TestScreenPreview />
        </div>
      </section>

      <section className="border-y border-hairline px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <h2 className="text-[30px] font-bold leading-tight tracking-[-0.01em] sm:text-[36px]">One switch between English and Math</h2>
            <p className="mt-3 max-w-[440px] text-[17px] leading-relaxed text-ink-soft">
              Your page stays where it is. Only the questions change.
            </p>
          </div>
          <SubjectShowcase />
        </div>
      </section>

      <section className="bg-paper px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-[30px] font-bold leading-tight tracking-[-0.01em] sm:text-[36px]">Four ways to practice</h2>
          <ul className="mt-8 border-b border-hairline">
            {WAYS.map((w) => (
              <li key={w.name} className="grid gap-x-8 gap-y-1 border-t border-hairline py-6 sm:grid-cols-[260px_1fr]">
                <h3 className="text-[19px] font-bold">{w.name}</h3>
                <p className="text-[17px] leading-relaxed text-ink-soft">{w.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-[30px] font-bold leading-tight tracking-[-0.01em] sm:text-[36px]">Start with one full test</h2>
            <p className="mt-2 text-[17px] text-ink-soft">It takes about an hour and shows you where to focus.</p>
          </div>
          <BtnLink href="/login" className="h-11 px-5 text-[16px]">
            Create free account
          </BtnLink>
        </div>
      </section>

      <footer className="border-t border-hairline px-5 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-3 py-7 text-[13px] leading-normal text-graphite">
          <div className="max-w-[640px] space-y-1">
            <p>SAT is a registered trademark of the College Board, which is not affiliated with GreenBook.</p>
            <p>SQB topics: {SQB_CREDIT}</p>
          </div>
          <p>© 2026 GreenBook</p>
        </div>
      </footer>
    </div>
  );
}
