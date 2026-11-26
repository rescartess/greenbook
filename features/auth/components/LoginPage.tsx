import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/core/design/ui";
import { LoginForm } from "./LoginForm";

/** Sign-in screen: email plus the class invite code, or an emailed one-time link. No passwords to remember. */
export function LoginPage() {
  return (
    <main className="gb-colors flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-hairline bg-paper">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-5 sm:px-8">
          <Link href="/" className="text-ink">
            <Logo size={28} />
          </Link>
        </div>
      </header>
      <div className="flex flex-1 items-start justify-center px-5 py-12 sm:items-center sm:py-16">
        <div className="w-full max-w-[400px]">
          <section className="rounded-[14px] border border-hairline bg-paper px-6 py-8 sm:px-8">
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em]">Log in to GreenBook</h1>
            <p className="mt-1.5 text-[15px] text-graphite">Your tests, results and mistakes, saved in one place</p>
            <Suspense fallback={<div className="mt-7 h-[214px]" />}>
              <LoginForm />
            </Suspense>
          </section>
          <p className="mt-5 text-[13px] text-graphite">New here? Logging in the first time creates your free account.</p>
        </div>
      </div>
    </main>
  );
}
