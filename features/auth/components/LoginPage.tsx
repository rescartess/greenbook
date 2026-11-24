import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/core/design/ui";
import { LoginForm } from "./LoginForm";

/** Sign-in screen: one email field, a one-time link, no passwords to remember. */
export function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-16">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="mb-10 flex justify-center text-ink">
          <Logo size={40} wordmarkClassName="text-2xl" />
        </Link>
        <section className="glass rounded-card px-7 py-9 text-center">
          <h1 className="text-[28px] font-extrabold tracking-tight">Log in to GreenBook</h1>
          <p className="mt-2 text-[15px] text-graphite">Your tests, results and mistakes, saved in one place.</p>
          <Suspense fallback={<div className="mt-8 h-[156px]" />}>
            <LoginForm />
          </Suspense>
        </section>
        <p className="mt-6 text-center text-[13px] text-graphite">
          New here? The same link creates your free account.
        </p>
      </div>
    </main>
  );
}
