import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { PageTitle } from "@/core/shell";
import { getStudentProfile } from "../queries";
import { ProfileBanner } from "./ProfileBanner";

/**
 * Another student's profile (owner request 27 Nov 2026), opened from the leaderboard: the same
 * banner as the dashboard, read only. Photo, name, bio, joined, time practicing, questions
 * answered, best full test and their place on the leaderboard.
 */
export function StudentPage({ subject, id }: { subject: SubjectSlug; id: string }) {
  return (
    <Suspense fallback={<div className="h-[320px] rounded-[var(--fp-r-card)] border border-hairline bg-paper" aria-busy="true" />}>
      <StudentContent subject={subject} id={id} />
    </Suspense>
  );
}

async function StudentContent({ subject, id }: { subject: SubjectSlug; id: string }) {
  const s = await getStudentProfile(id, subject);
  if (!s) notFound();
  const initials = s.name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <>
      <PageTitle title={s.me ? "You, from outside" : s.name} back={{ href: `/${subject}/dashboard`, label: "Dashboard" }} />
      <ProfileBanner
      subjectLabel={SUBJECTS[subject].label}
        name={s.name}
        initials={initials || "?"}
        avatarUrl={s.avatarUrl}
        banner={s}
        score={s.bestScore === null ? null : { value: s.bestScore, changeSinceFirst: null }}
        scoreLabel="best"
        bio={<p className="text-[16px] leading-snug text-ink">{s.bio ?? <span className="text-graphite">Silent type.</span>}</p>}
      />
    </>
  );
}
