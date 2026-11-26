import Link from "next/link";
import { Logo } from "@/core/design/ui";
import { BtnLink } from "@/core/shell";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
      <Link href="/" className="text-ink">
        <Logo size={34} />
      </Link>
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.01em]">This page doesn’t exist</h1>
        <p className="mt-2 text-[16px] text-graphite">The link may be old, or the page was moved.</p>
      </div>
      <div className="flex gap-2.5">
        <BtnLink href="/english/dashboard">Go to your dashboard</BtnLink>
        <BtnLink href="/" tone="quiet">
          Home
        </BtnLink>
      </div>
    </main>
  );
}
