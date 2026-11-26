import Link from "next/link";
import { Suspense } from "react";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { BtnLink, CardSkeleton, Empty, PageTitle } from "@/core/shell";
import { getMistakes } from "../queries";
import { groupByPractice, type Mistake, type MistakePractice } from "../schema";

/** Mistakes, listed by the practice they come from. Each one opens its own page of questions. */
export function MistakesPage({ subject }: { subject: SubjectSlug }) {
  return (
    <Suspense fallback={<MistakesFrame subject={subject} count={null}><CardSkeleton /></MistakesFrame>}>
      <PracticeList subject={subject} />
    </Suspense>
  );
}

async function PracticeList({ subject }: { subject: SubjectSlug }) {
  return <MistakesView subject={subject} list={await getMistakes(subject)} />;
}

function MistakesFrame({ subject, count, children }: { subject: SubjectSlug; count: number | null; children: React.ReactNode }) {
  return (
    <>
      <PageTitle
        title="Mistakes"
        subtitle={
          count
            ? `${count} ${SUBJECTS[subject].name} question${count === 1 ? "" : "s"} to review. Get one right twice in a row and it leaves the list.`
            : SUBJECTS[subject].name
        }
      />
      {children}
    </>
  );
}

export function MistakesView({ subject, list }: { subject: SubjectSlug; list: Mistake[] }) {
  if (list.length === 0) {
    return (
      <MistakesFrame subject={subject} count={0}>
        <Empty title="Nothing to review" action={<BtnLink href={`/${subject}/topics`}>Practice a topic</BtnLink>}>
          Questions you miss in tests and practice show up here until you get them right twice in a row.
        </Empty>
      </MistakesFrame>
    );
  }
  return (
    <MistakesFrame subject={subject} count={list.length}>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
        {groupByPractice(list).map((p) => (
          <li key={p.key}>
            <PracticeCard subject={subject} practice={p} />
          </li>
        ))}
      </ul>
    </MistakesFrame>
  );
}

function PracticeCard({ subject, practice }: { subject: SubjectSlug; practice: MistakePractice }) {
  const n = practice.items.length;
  return (
    <Link
      href={`/${subject}/mistakes/${practice.key}`}
      className="flex h-full flex-col rounded-[14px] border border-hairline bg-paper p-5 transition-colors hover:border-graphite/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
    >
      <h2 className="text-[18px] font-bold leading-snug">{practice.title}</h2>
      <p className="mt-1 text-[14px] text-graphite">{practice.label}</p>
      <p className="mt-4 text-[28px] font-bold leading-none tabular-nums">{n}</p>
      <p className="mt-1 text-[14px] text-ink-soft">mistake{n === 1 ? "" : "s"} to review</p>
      <div className="mt-auto pt-5">
        <span className="flex h-10 items-center justify-center rounded-[10px] bg-pine text-[15px] font-bold text-pine-ink">
          Review mistakes
        </span>
      </div>
    </Link>
  );
}
