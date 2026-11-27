import Link from "next/link";
import type { ReactNode } from "react";
import { SubjectSegment } from "./SubjectSegment";
import { Sticker, titleEmoji } from "./stickers";

/**
 * Page title for the logged-in pages around the exam: rainbow letters with an emoji sticker.
 * Optional link back to the parent page, an aside (like a delete button), and the English/Math switch.
 */
export function PageTitle({
  title,
  subtitle,
  back,
  aside,
  subjectSwitch = true,
  emoji,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  aside?: ReactNode;
  subjectSwitch?: boolean;
  /** Sticker next to the title; picked from the title's words when left out. */
  emoji?: string;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-1.5 inline-flex items-center gap-1 text-[14px] font-semibold text-graphite hover:text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            {back.label}
          </Link>
        ) : null}
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] leading-tight tracking-[-0.01em] sm:text-[34px]">{title}</h1>
          <Sticker emoji={emoji ?? titleEmoji(title)} size={30} tilt={10} className="shrink-0" />
        </div>
        {subtitle ? <p className="mt-1 max-w-2xl text-[15px] text-graphite">{subtitle}</p> : null}
      </div>
      {aside ?? (subjectSwitch ? <SubjectSegment /> : null)}
    </header>
  );
}
