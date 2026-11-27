import Link from "next/link";
import { SQB_CREDIT } from "@/core/config/practice";
import { Logo } from "@/core/design/ui";
import { BtnLink, RainbowStripe, Sprinkles, Sticker, ThemeButton } from "@/core/shell";
import { SubjectShowcase } from "./SubjectShowcase";
import { TestScreenPreview } from "./TestScreenPreview";

const WAYS = [
  { emoji: "📝", name: "Full tests", text: "Two adaptive modules, timed like test day, scored from 200 to 800." },
  { emoji: "📚", name: "By topic", text: "Pick one skill, from transitions to circle equations, and drill only that." },
  { emoji: "🍓", name: "Your mistakes", text: "Every question you miss waits here until you get it right twice." },
];

/** A big rainbow arc drawn behind the hero headline. */
function HeroRainbow() {
  const bands = ["var(--rp-red)", "var(--rp-orange)", "var(--rp-yellow)", "var(--rp-green)", "var(--rp-blue)", "var(--rp-violet)"];
  return (
    <svg aria-hidden="true" viewBox="0 0 600 320" className="pointer-events-none absolute -top-10 left-1/2 w-[760px] max-w-none -translate-x-1/2 opacity-25 lg:left-[22%]">
      {bands.map((c, i) => {
        const r = 280 - i * 26;
        return <path key={c} d={`M${300 - r} 320 A ${r} ${r} 0 0 1 ${300 + r} 320`} fill="none" stroke={c} strokeWidth="24" />;
      })}
    </svg>
  );
}

export function HomePage() {
  return (
    <div className="gb-colors relative min-h-dvh bg-canvas">
      <Sprinkles roomy />
      <RainbowStripe />
      <header className="relative border-b border-hairline bg-paper">
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-5 pt-1.5 sm:px-8">
          <Link href="/" className="text-ink">
            <Logo size={30} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeButton />
            <Link href="/login" className="hidden text-[15px] font-bold text-ink-soft hover:text-ink sm:inline">
              Log in
            </Link>
            <BtnLink href="/login">Create account</BtnLink>
          </div>
        </nav>
      </header>

      <section className="rp-hero relative overflow-hidden px-5 pb-16 pt-14 sm:px-8 lg:pb-24 lg:pt-20">
        <HeroRainbow />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="max-w-[520px]">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-pine-soft bg-paper px-3.5 py-1.5 text-[14px] font-extrabold text-pine">
              <Sticker emoji="🌈" size={16} tilt={0} /> Free SAT practice for everyone
            </p>
            <h1 className="text-[42px] leading-[1.06] tracking-[-0.02em] sm:text-[56px]">
              Practice the SAT the way you’ll take it
            </h1>
            <p className="mt-5 text-[18px] leading-relaxed text-ink-soft">
              Adaptive full tests, practice by topic and every mistake saved. Sweet as strawberries, bright as a rainbow.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <BtnLink href="/login" className="h-12 px-6 text-[16px]">
                Create free account <span aria-hidden="true">🍓</span>
              </BtnLink>
              <BtnLink href="/login" tone="quiet" className="h-12 px-6 text-[16px]">
                Log in
              </BtnLink>
            </div>
          </div>
          <div className="relative">
            <Sticker emoji="🍓" size={46} tilt={-18} bob className="absolute -left-5 -top-6 z-10" />
            <Sticker emoji="🌈" size={52} tilt={12} bob className="absolute -right-4 -top-8 z-10" style={{ animationDelay: "-1.6s" }} />
            <Sticker emoji="✨" size={34} tilt={0} bob className="absolute -bottom-5 left-1/3 z-10" style={{ animationDelay: "-2.4s" }} />
            <Sticker emoji="🍓" size={34} tilt={16} bob className="absolute -bottom-4 -right-3 z-10" style={{ animationDelay: "-0.7s" }} />
            <TestScreenPreview />
          </div>
        </div>
      </section>

      <section className="relative border-y border-hairline px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <Sticker emoji="🔀" size={34} tilt={-8} className="mb-3" />
            <h2 className="text-[30px] font-black leading-tight tracking-[-0.01em] sm:text-[36px]">One switch between English and Math</h2>
            <p className="mt-3 max-w-[440px] text-[17px] leading-relaxed text-ink-soft">
              Your page stays where it is. Only the questions change.
            </p>
          </div>
          <SubjectShowcase />
        </div>
      </section>

      <section className="relative bg-paper px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-[30px] font-black leading-tight tracking-[-0.01em] sm:text-[36px]">
            Three <span className="rp-rainbow-text">colorful</span> ways to practice
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {WAYS.map((w, i) => (
              <li key={w.name} className="rp-card rounded-[18px] border border-hairline bg-canvas p-6">
                <Sticker emoji={w.emoji} size={40} tilt={i % 2 ? 10 : -10} />
                <h3 className="mt-4 text-[20px] font-black">{w.name}</h3>
                <p className="mt-1.5 text-[16px] leading-relaxed text-ink-soft">{w.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative px-5 py-20 sm:px-8">
        <div className="rp-card mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 rounded-[22px] border border-hairline bg-paper px-6 py-10 sm:px-10">
          <div className="flex items-center gap-5">
            <Sticker emoji="🍓" size={56} tilt={-12} bob />
            <div>
              <h2 className="text-[28px] font-black leading-tight tracking-[-0.01em] sm:text-[34px]">Start with one full test</h2>
              <p className="mt-2 text-[17px] text-ink-soft">It takes about an hour and shows you where to focus.</p>
            </div>
          </div>
          <BtnLink href="/login" className="h-12 px-6 text-[16px]">
            Create free account <span aria-hidden="true">🌈</span>
          </BtnLink>
        </div>
      </section>

      <footer className="relative border-t border-hairline bg-paper px-5 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-3 py-7 text-[13px] leading-normal text-graphite">
          <div className="max-w-[640px] space-y-1">
            <p>SAT is a registered trademark of the College Board, which is not affiliated with RainbowPrep.</p>
            <p>SQB topics: {SQB_CREDIT}</p>
          </div>
          <p>© 2026 RainbowPrep · made with 🍓 and 🌈</p>
        </div>
      </footer>
    </div>
  );
}
