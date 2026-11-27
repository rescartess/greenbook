import Image from "next/image";
import Link from "next/link";
import { SQB_CREDIT } from "@/core/config/practice";
import { Logo } from "@/core/design/ui";
import { BerryStripe, BtnLink, DesignPicker, Sprinkles, Sticker, ThemeButton } from "@/core/shell";
import founder from "@/public/home/founder.jpg";
import { BubbleField } from "./BubbleField";
import { Faq } from "./Faq";
import { Showcase } from "./Showcase";

/**
 * The first page visitors see (owner request 28 Nov 2026, third pass): the founder's photo, very few
 * words, cold and certain ("They not like us." / "We don't sell hope. We give it." / "Why us?
 * Explore. Not another prep site." / "Your choice."). The most important features float on the
 * photo; then the design dial, profiles, questions and a closing banner. Lessons in CLAUDE.md.
 */

const NAV = [
  { href: "#why", label: "Why us" },
  { href: "#designs", label: "Designs" },
  { href: "#profiles", label: "Profiles" },
  { href: "#faq", label: "FAQ" },
];

/** What matters most, on the photo. A few words each. */
const ON_PHOTO = [
  { text: "The real test screen", place: "lg:-left-10 lg:top-[14%]" },
  { text: "Adaptive modules", place: "lg:-right-8 lg:top-[34%]" },
  { text: "Mistakes stay", place: "lg:-left-14 lg:top-[58%]" },
  { text: "Ranked by right answers", place: "lg:-right-10 lg:bottom-[14%]" },
];

function Title({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[40px] font-extrabold leading-[1] tracking-[-0.045em] sm:text-[64px] ${className}`}>{children}</h2>;
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

      {/* Hero: the line, the photo, the features on it */}
      <section className="relative px-5 pb-24 pt-10 sm:px-8 sm:pt-16 lg:pb-32">
        <BubbleField className="fp-bubble-mask pointer-events-none absolute inset-x-0 top-0 hidden justify-start opacity-25 md:flex" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
          <div>
            <h1 className="text-[64px] font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-[112px] lg:text-[128px]">
              They not
              <br />
              <span className="fp-accent">like us.</span>
            </h1>
            <p className="mt-8 max-w-[460px] text-[20px] leading-snug text-ink-soft sm:text-[24px]">
              We don’t sell hope.
              <br />
              We give it.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <BtnLink href="/login" className="h-12 px-8 text-[16px]">
                Start
                <Sticker emoji="🍓" size={18} tilt={0} />
              </BtnLink>
              <BtnLink href="#why" tone="quiet" className="h-12 px-7 text-[16px]">
                Why us?
              </BtnLink>
            </div>
          </div>

          <figure className="relative mx-auto w-full max-w-[460px]">
            {/* A soft glow in the design's main color behind the photo. */}
            <div aria-hidden="true" className="fp-photo-glow absolute -inset-10 rounded-[48px] blur-3xl" />
            <div className="fp-photo relative overflow-hidden rounded-[var(--fp-r-card)] border border-hairline">
              <Image
                src={founder}
                alt="The founder of QuantumTest, leaning back in his chair"
                priority
                placeholder="blur"
                sizes="(min-width: 1024px) 460px, 92vw"
                className="h-auto w-full"
              />
              <figcaption className="absolute bottom-4 left-4 rounded-full bg-black/45 px-3 py-1 font-mono text-[12px] text-white/85 backdrop-blur-sm">
                Founder.
              </figcaption>
            </div>
            <ul className="mt-4 flex flex-wrap gap-2 lg:mt-0">
              {ON_PHOTO.map((f) => (
                <li key={f.text} className={`fp-glass flex items-center gap-2 rounded-full border border-hairline px-3.5 py-2 text-[13px] font-semibold text-ink lg:absolute ${f.place}`}>
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-pine" />
                  {f.text}
                </li>
              ))}
            </ul>
          </figure>
        </div>
      </section>

      {/* Why us */}
      <section id="why" className="relative scroll-mt-24 px-5 pb-28 sm:px-8 sm:pb-36">
        <div className="mx-auto max-w-[1200px] text-[48px] font-extrabold leading-[0.98] tracking-[-0.05em] sm:text-[88px] lg:text-[104px]">
          <p className="text-graphite">Why us?</p>
          <p>
            <Link href="/login" className="fp-accent underline decoration-[0.06em] underline-offset-[0.12em] transition-opacity hover:opacity-80">
              Explore.
            </Link>
          </p>
          <p>Not another prep site.</p>
        </div>
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

      {/* Profiles */}
      <section id="profiles" className="relative scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Title>
            Make it yours.
            <br />
            <span className="text-graphite">Photo. Bio. Rank.</span>
          </Title>
          <Showcase />
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
        <div className="fp-ink-card mx-auto flex max-w-[1248px] flex-col items-start justify-between gap-10 overflow-hidden rounded-[28px] px-6 py-20 sm:px-12 sm:py-28 lg:flex-row lg:items-end">
          <h2 className="text-[64px] font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-[120px] lg:text-[144px]">Your choice.</h2>
          <Link href="/login" className="fp-label inline-flex h-14 shrink-0 items-center rounded-[var(--fp-r-btn)] bg-paper px-8 text-[17px] font-bold text-ink transition-transform hover:-translate-y-0.5">
            Start
          </Link>
        </div>
      </section>

      <footer className="relative px-5 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-start justify-between gap-6 py-10 text-[13px] leading-normal text-graphite">
          <div className="max-w-[640px] space-y-1.5">
            <Logo size={24} wordmarkClassName="text-[16px]" />
            <p className="pt-2">SAT is a registered trademark of the College Board, which is not affiliated with QuantumTest.</p>
            <p>SQB topics: {SQB_CREDIT}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="flex gap-4">
              <Link href="/privacy" className="hover:text-ink">Privacy</Link>
              <Link href="/terms" className="hover:text-ink">Terms</Link>
            </p>
            <p>
              © 2026 QuantumTest<span className="rp-only"> · made with 🍓</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
