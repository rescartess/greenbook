import Link from "next/link";
import { ButtonLink, Logo } from "@/core/design/ui";

/** Sign-in screen. The buttons are wired to Supabase Auth in milestone 2. */
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
          <div className="mt-8 flex flex-col gap-3">
            <ButtonLink href="/english/dashboard" size="lg" className="w-full">
              Continue with Google
            </ButtonLink>
            <ButtonLink href="/english/dashboard" variant="quiet" size="lg" className="w-full">
              Continue with email
            </ButtonLink>
          </div>
        </section>
        <p className="mt-6 text-center text-[13px] text-graphite">
          New here? Logging in creates your free account.
        </p>
      </div>
    </main>
  );
}
