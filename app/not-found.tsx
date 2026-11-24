import Link from "next/link";
import { ButtonLink, Logo } from "@/core/design/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
      <Link href="/" className="text-ink">
        <Logo size={34} />
      </Link>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">This page doesn’t exist</h1>
        <p className="mt-2 text-[17px] text-graphite">The link may be old, or the page was moved.</p>
      </div>
      <div className="flex gap-2.5">
        <ButtonLink href="/english/dashboard">Go to your dashboard</ButtonLink>
        <ButtonLink href="/" variant="quiet">
          Home
        </ButtonLink>
      </div>
    </main>
  );
}
