import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink, EmptyState } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { getMistakes } from "../queries";
import { groupByPractice, type MistakePractice } from "../schema";

/** Mistakes, listed by the practice they come from. Each one opens its own page of questions. */
export function MistakesPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="Mistakes" subtitle={SUBJECTS[subject].name} />
      <Suspense fallback={<div className="h-48 animate-pulse rounded-panel bg-paper" />}>
        <PracticeList subject={subject} />
      </Suspense>
    </>
  );
}

async function PracticeList({ subject }: { subject: SubjectSlug }) {
  const list = await getMistakes(subject);
  if (list.length === 0) {
    return (
      <EmptyState title="Nothing to review">
        Questions you miss in tests and practice show up here until you get them right twice in a row.
        <span className="mt-4 block">
          <ButtonLink href={`/${subject}/topics`}>Practice a topic</ButtonLink>
        </span>
      </EmptyState>
    );
  }
  const practices = groupByPractice(list);
  return (
    <>
      <p className="-mt-2 mb-7 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
        {list.length} question{list.length === 1 ? "" : "s"} to review. Choose a practice to see its mistakes. Get one
        right twice in a row and it leaves the list.
      </p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-5">
        {practices.map((p) => (
          <li key={p.key}>
            <PracticeCard subject={subject} practice={p} />
          </li>
        ))}
      </ul>
    </>
  );
}

function PracticeCard({ subject, practice }: { subject: SubjectSlug; practice: MistakePractice }) {
  const n = practice.items.length;
  return (
    <Link
      href={`/${subject}/mistakes/${practice.key}`}
      className="flex h-full flex-col rounded-xl border-[1.5px] border-control bg-paper p-6 transition-colors hover:border-pine focus-visible:outline-2 focus-visible:outline-pine"
    >
      <h2 className="text-[21px] font-extrabold leading-tight tracking-tight">{practice.title}</h2>
      <p className="mt-1 text-[15px] text-graphite">{practice.label}</p>
      <p className="mt-4 text-[16px] text-ink-soft tabular-nums">
        {n} mistake{n === 1 ? "" : "s"}
      </p>
      <div className="mt-auto pt-6">
        <span className="block rounded-lg bg-pine py-3 text-center text-[16px] font-bold text-pine-ink">
          Review mistakes
        </span>
      </div>
    </Link>
  );
}
