import Link from "next/link";
import { Suspense } from "react";
import { SQB_CREDIT } from "@/core/config/practice";
import type { SubjectSlug } from "@/core/config/subjects";
import { ButtonLink, EmptyState, Panel } from "@/core/design/ui";
import { toPlainText } from "@/core/question";
import { getMistakes } from "../queries";
import { groupByPractice, groupMistakes, type Mistake } from "../schema";
import { MistakeRetry } from "./MistakeRetry";

/** All mistakes from one practice (a topic or a test), to open and try again. */
export function MistakeSetPage({ subject, practiceKey }: { subject: SubjectSlug; practiceKey: Promise<string> }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-panel bg-paper" />}>
      <Practice subject={subject} practiceKey={practiceKey} />
    </Suspense>
  );
}

async function Practice({ subject, practiceKey }: { subject: SubjectSlug; practiceKey: Promise<string> }) {
  const key = await practiceKey;
  const practice = groupByPractice(await getMistakes(subject)).find((p) => p.key === key);
  const back = (
    <Link href={`/${subject}/mistakes`} className="text-[15px] font-semibold text-pine hover:underline">
      Mistakes
    </Link>
  );
  if (!practice) {
    return (
      <>
        <header className="mb-6 pt-1 sm:pt-3">{back}</header>
        <EmptyState title="No mistakes left here">
          You cleared every question from this practice.
          <span className="mt-4 block">
            <ButtonLink href={`/${subject}/mistakes`}>Back to Mistakes</ButtonLink>
          </span>
        </EmptyState>
      </>
    );
  }
  const n = practice.items.length;
  return (
    <>
      <header className="mb-6 pt-1 sm:pt-3">
        {back}
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-[40px] sm:leading-tight">{practice.title}</h1>
        <p className="mt-1 text-[17px] text-graphite">
          {practice.label}. {n} question{n === 1 ? "" : "s"} to review. Get one right twice in a row and it leaves the
          list.
        </p>
      </header>
      <MistakeQuestions list={practice.items} />
      {practice.collection === "sqb" ? <p className="mt-8 text-[14px] text-graphite">{SQB_CREDIT}</p> : null}
    </>
  );
}

/** The questions, grouped by area and question type. Open one to try it again. */
function MistakeQuestions({ list }: { list: Mistake[] }) {
  const groups = groupMistakes(list);
  const numberOf = new Map(groups.flatMap((g) => g.topics.flatMap((t) => t.items)).map((m, i) => [m.id, i + 1]));
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.area}>
          <h2 className="mb-3 text-xl font-extrabold tracking-tight">{group.area}</h2>
          <Panel className="p-0">
            {group.topics.map((topic) => (
              <div key={topic.topic} className="border-b border-hairline last:border-b-0">
                <h3 className="px-6 pb-2 pt-4 text-[15px] font-bold text-graphite">{topic.topic}</h3>
                <ul className="divide-y divide-hairline">
                  {topic.items.map((m) => (
                    <li key={m.id}>
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-3.5 hover:bg-mist [&::-webkit-details-marker]:hidden">
                          <span className="w-7 shrink-0 text-[15px] font-bold tabular-nums text-graphite">
                            {numberOf.get(m.id)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[15px]">{toPlainText(m.passage || m.prompt)}</span>
                          <span className="shrink-0 text-sm text-graphite">
                            Missed {m.timesWrong === 1 ? "once" : `${m.timesWrong} times`}
                          </span>
                        </summary>
                        <div className="border-t border-hairline bg-mist px-3 pb-5 pt-3 sm:px-5">
                          <MistakeRetry mistake={m} number={numberOf.get(m.id) ?? 1} />
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Panel>
        </section>
      ))}
    </div>
  );
}
