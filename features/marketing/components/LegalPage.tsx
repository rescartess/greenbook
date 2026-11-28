import Link from "next/link";
import type { ReactNode } from "react";
import { SQB_CREDIT } from "@/core/config/practice";
import { Logo } from "@/core/design/ui";
import { ThemeButton } from "@/core/shell";

const CONTACT = "ravshanbekrahmonov91@gmail.com";
const UPDATED = "28 November 2026";

function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="gb-colors fp-display min-h-dvh bg-canvas">
      <header className="px-5 pt-5 sm:px-8">
        <nav className="mx-auto flex h-14 max-w-[760px] items-center justify-between">
          <Link href="/" className="text-ink">
            <Logo size={26} wordmarkClassName="text-[18px]" />
          </Link>
          <ThemeButton />
        </nav>
      </header>
      <main className="mx-auto max-w-[760px] px-5 pb-24 pt-10 sm:px-8">
        <h1 className="text-[40px] font-extrabold leading-tight tracking-[-0.04em] sm:text-[52px]">{title}</h1>
        <p className="mt-2 text-[14px] text-graphite">Updated {UPDATED}</p>
        <div className="mt-10 space-y-8 text-[16px] leading-relaxed text-ink-soft [&_h2]:mb-2 [&_h2]:text-[20px] [&_h2]:font-extrabold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
          {children}
        </div>
        <p className="mt-14 text-[13px] text-graphite">
          SAT is a registered trademark of the College Board, which is not affiliated with QuantumTest. SQB topics: {SQB_CREDIT}
        </p>
      </main>
    </div>
  );
}

/** /privacy: what the site keeps and who sees it. Linked from Google's sign-in screen. */
export function PrivacyPage() {
  return (
    <Frame title="Privacy">
      <section>
        <h2>What we keep</h2>
        <ul>
          <li>From Google sign-in: your name and email address.</li>
          <li>What you add: profile photo, bio, target score, SAT date and site colors.</li>
          <li>What you do: your answers, scores, mistakes and time spent practicing.</li>
        </ul>
      </section>
      <section>
        <h2>Who sees it</h2>
        <ul>
          <li>Other signed-in students see your name, photo, bio, join date, time practicing, questions answered, best full-test score and leaderboard rank.</li>
          <li>Nobody else sees your email or your answers. The site’s admin can see them to run the site.</li>
        </ul>
      </section>
      <section>
        <h2>Where it lives</h2>
        <p>
          Your account and practice data are stored with Supabase (servers in Frankfurt, Germany). The site runs on Vercel. Your chosen design and light or dark mode are saved only in your browser.
        </p>
      </section>
      <section>
        <h2>What we don’t do</h2>
        <p>No ads. We don’t sell or share your data. The only cookies are the ones that keep you signed in.</p>
      </section>
      <section>
        <h2>Leaving</h2>
        <p>
          Delete your account any time: Profile › Delete my account. Your scores, answers, mistakes and photo go with it. Need help? Email <a className="font-semibold text-pine underline underline-offset-4" href={`mailto:${CONTACT}`}>{CONTACT}</a> from the address you sign in with.
        </p>
      </section>
    </Frame>
  );
}

/** /terms: the short rules for using the site. Linked from Google's sign-in screen. */
export function TermsPage() {
  return (
    <Frame title="Terms">
      <section>
        <h2>Free</h2>
        <p>QuantumTest is free SAT practice. Using it means you accept these terms.</p>
      </section>
      <section>
        <h2>Your account</h2>
        <ul>
          <li>One account per person. Don’t share it.</li>
          <li>Keep your name, photo and bio decent: other students see them.</li>
        </ul>
      </section>
      <section>
        <h2>The questions</h2>
        <p>
          Questions belong to their authors: our own books, and College Board’s question bank, shown with credit. Practice with them here; don’t copy or republish them.
        </p>
      </section>
      <section>
        <h2>Scores</h2>
        <p>Scores are estimates to help you practice. They are not official SAT scores.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>
          The site is provided as it is. We may change features or remove accounts that break these rules. Questions? Email{" "}
          <a className="font-semibold text-pine underline underline-offset-4" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </section>
    </Frame>
  );
}
