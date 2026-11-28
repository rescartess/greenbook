import Image from "next/image";
import Link from "next/link";
import { SQB_CREDIT } from "@/core/config/practice";
import { Logo } from "@/core/design/ui";
import { BerryStripe, BtnLink, DesignPicker, Sprinkles, Sticker, ThemeButton } from "@/core/shell";
import founder from "@/public/home/founder.jpg";
import screen from "@/public/home/screen.jpg";
import { Showcase } from "./Showcase";

/**
 * The first page visitors see (owner request 28 Nov 2026, third pass): the founder's photo, very few
 * words, cold and certain ("They not like us." / "Why us?
 * Explore. Not another prep site." / "Your choice. We don't sell hope. We give it."). The most important features float on the
 * photo; then the design dial, profiles and a closing banner. Lessons in CLAUDE.md.
 */

const NAV = [
  { href: "#why", label: "Why us" },
  { href: "#designs", label: "Designs" },
  { href: "#profiles", label: "Profiles" },
];

/** Where each photo fades into the page (CSS mask layers, all must be opaque to show). */
const HERO_FADE = [
  "linear-gradient(to right, transparent 0%, #000 38%)",
  "linear-gradient(to top, transparent 0%, #000 34%)",
  "linear-gradient(to bottom, transparent 0%, #000 14%)",
  "linear-gradient(to left, transparent 0%, #000 10%)",
].join(", ");
const SCREEN_FADE = [
  "linear-gradient(to left, transparent 0%, #000 22%)",
  "linear-gradient(to top, transparent 0%, #000 28%)",
  "linear-gradient(to bottom, transparent 0%, #000 22%)",
  "linear-gradient(to right, transparent 0%, #000 12%)",
].join(", ");
/** The TV screen inside screen.jpg (percent of the picture): keeps its own colors. */
const SCREEN_KEEP =
  "polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, 52.4% 17.8%, 100% 14.7%, 100% 49.3%, 52% 45.7%, 52.4% 17.8%)";

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

      {/* Hero (always dark, so the photo melts into it): the founder, the name, the line. */}
      <section className="fp-dark relative -mt-[88px] overflow-hidden pt-[88px] sm:-mt-[96px] sm:pt-[96px]">
        <div className="relative mx-auto grid max-w-[1440px] lg:min-h-[min(100dvh,980px)] lg:grid-cols-12">
          {/* The photo: right side on wide screens, top on phones. Its edges fade into the page. */}
          <figure
            className="fp-blend relative lg:absolute lg:inset-y-0 lg:right-0 lg:w-[60%]"
            style={{ "--fp-blend-mask": HERO_FADE, "--fp-glow-at": "58% 36%", "--fp-glow": "14%" } as React.CSSProperties}
          >
            <Image
              src={founder}
              alt="The founder of QuantumTest, leaning back in his chair"
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="h-[62svh] w-full object-cover object-[60%_30%] lg:h-full"
            />
          </figure>

          <div className="relative z-10 -mt-24 px-5 pb-20 sm:-mt-32 sm:px-8 lg:col-span-7 lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:px-12 lg:pb-16 lg:pt-6 xl:px-[120px]">
            <p className="text-[64px] font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-[104px] lg:text-[clamp(88px,8vw,116px)]">
              They not
              <br />
              <span className="fp-accent">like us.</span>
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
        </div>

        {/* The name, huge, sitting on the photo's faded edge: one piece with the picture. */}
        <h1
          className="fp-masthead pointer-events-none relative z-10 mx-auto -mt-6 max-w-[1440px] select-none whitespace-nowrap px-5 text-center text-[15vw] font-extrabold leading-[0.78] tracking-[-0.065em] sm:px-8 lg:-mt-[150px] lg:text-[min(15vw,216px)]"
        >
          <span className="fp-word-1">Quantum</span>
          <span className="fp-word-2">Test</span>
        </h1>
      </section>

      {/* Second page: the dashboard on the screen. Why us? Explore. */}
      <section id="why" className="fp-dark relative scroll-mt-24 overflow-hidden">
        <div className="relative mx-auto grid max-w-[1440px] items-center lg:min-h-[min(100dvh,940px)] lg:grid-cols-12">
          <figure
            className="fp-blend relative lg:col-span-7"
            style={{ "--fp-blend-mask": SCREEN_FADE, "--fp-glow-at": "28% 46%", "--fp-glow": "10%", "--fp-keep": SCREEN_KEEP } as React.CSSProperties}
          >
            <Image
              src={screen}
              alt="The founder pointing a light at a screen that shows the QuantumTest dashboard in the Nerd design"
              placeholder="blur"
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="h-auto w-full"
            />
          </figure>
          <div className="relative z-10 -mt-16 px-5 pb-24 text-[52px] font-extrabold leading-[0.96] tracking-[-0.05em] sm:px-8 sm:text-[80px] lg:col-span-5 lg:mt-0 lg:pb-0 lg:pl-0 lg:pr-12 lg:text-[clamp(60px,5.8vw,84px)] xl:pr-[120px]">
            <p className="text-graphite">Why us?</p>
            <p>
              <Link href="/login" className="fp-accent underline decoration-[0.06em] underline-offset-[0.12em] transition-opacity hover:opacity-80">
                Explore.
              </Link>
            </p>
            <p>
              Not another
              <br />
              prep site.
            </p>
          </div>
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

      {/* Closing */}
      <section className="relative px-3 pb-6 sm:px-6">
        <div className="fp-ink-card mx-auto flex max-w-[1248px] flex-col items-start justify-between gap-10 overflow-hidden rounded-[28px] px-6 py-20 sm:px-12 sm:py-28 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-[64px] font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-[120px] lg:text-[144px]">Your choice.</h2>
            <p className="mt-7 text-[20px] leading-snug opacity-70 sm:text-[24px]">
              We don’t sell hope.
              <br />
              We give it.
            </p>
          </div>
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
