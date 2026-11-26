import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/core/design/ui";
import { BottomTabs } from "./SideNav";
import { ThemeButton } from "./ThemeButton";

/**
 * The logged-in frame around the exam pages: a flush side panel (laptops), an icon rail
 * (narrow windows) or a bottom bar (phones). `nav` is the SideNav, passed in so its
 * signed-in parts can load behind a Suspense boundary.
 */
export function Shell({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      {nav}
      <main className="min-w-0 flex-1 px-4 pb-28 pt-4 sm:px-8 sm:pb-12 sm:pt-8 nav:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-6 flex items-center justify-between sm:hidden">
            <Link href="/" className="text-ink">
              <Logo size={28} />
            </Link>
            <ThemeButton />
          </div>
          {children}
        </div>
      </main>
      <Suspense fallback={null}>
        <BottomTabs />
      </Suspense>
    </div>
  );
}
