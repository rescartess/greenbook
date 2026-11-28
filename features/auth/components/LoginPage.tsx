import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/core/design/ui";
import { BerryStripe, Sprinkles, Sticker, WinterScene } from "@/core/shell";
import { LoginForm } from "./LoginForm";

/** Sign-in screen: email plus the class invite code, or an emailed one-time link. No passwords to remember. */
export function LoginPage() {
  return (
    <main className="gb-colors relative flex min-h-dvh flex-col bg-canvas">
      <Sprinkles roomy />
      <BerryStripe />
      <WinterScene roomy />
      <header className="relative border-b border-hairline bg-paper">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-5 pt-1.5 sm:px-8">
          <Link href="/" className="text-ink">
            <Logo size={30} />
          </Link>
        </div>
      </header>
      <div className="relative flex flex-1 items-start justify-center px-5 py-12 sm:items-center sm:py-16">
        <div className="relative w-full max-w-[400px]">
          <Sticker emoji="🍓" size={44} tilt={-16} bob className="absolute -left-5 -top-6 z-10" />
          <Sticker emoji="🌸" size={40} tilt={12} bob className="absolute -right-4 -top-5 z-10" style={{ animationDelay: "-1.8s" }} />
          <Sticker design="winter" emoji="🎄" size={44} tilt={-10} bob className="absolute -left-5 -top-7 z-10" />
          <Sticker design="winter" emoji="🎁" size={36} tilt={12} bob className="absolute -right-4 -top-5 z-10" style={{ animationDelay: "-1.8s" }} />
          <section className="rp-card rounded-[var(--fp-r-card)] border border-hairline bg-paper px-6 py-9 sm:px-8">
            <h1 className="text-[32px] leading-tight tracking-[-0.03em]">Back for more.</h1>
            <p className="mt-1.5 text-[15px] text-graphite">One tap. You’re in.</p>
            <Suspense fallback={<div className="mt-7 h-[214px]" />}>
              <LoginForm />
            </Suspense>
          </section>
          <p className="mt-5 text-[13px] text-graphite">New? Your first sign-in makes your account<span aria-hidden="true" className="rp-only"> 🍓</span>. By signing in you accept the{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink">Terms</Link> and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
