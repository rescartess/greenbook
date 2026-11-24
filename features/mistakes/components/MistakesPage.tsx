import { Suspense } from "react";
import { ButtonLink, EmptyState, Panel } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { toPlainText } from "@/core/question";
import { getMistakes } from "../queries";
import { groupMistakes } from "../schema";
import { MistakeRetry } from "./MistakeRetry";

export function MistakesPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="Mistakes" subtitle={SUBJECTS[subject].name} />
      <Suspense fallback={<div className="h-48 animate-pulse rounded-panel bg-paper" />}>
        <MistakeList subject={subject} />
      </Suspense>
    </>
  );
}

async function MistakeList({ subject }: { subject: SubjectSlug }) {
  const list = await getMistakes(subject);
  if (list.length === 0) {
    return (
      <EmptyState title="Nothing to review">
        Questions you miss in tests and practice show up here until you get them right twice in a row.
        <span className="mt-4 block">
          <ButtonLink href={`/${subject}/full-tests`}>Take a full test</ButtonLink>
        </span>
      </EmptyState>
    );
  }

  const groups = groupMistakes(list);
  const numberOf = new Map(groups.flatMap((g) => g.topics.flatMap((t) => t.items)).map((m, i) => [m.id, i + 1]));
  return (
    <>
      <p className="-mt-2 mb-6 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
        {list.length} question{list.length === 1 ? "" : "s"} to review. Get one right twice in a row and it leaves the list.
      </p>
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.area}>
            <h2 className="mb-3 text-xl font-extrabold tracking-tight">{group.area}</h2>
            <Panel className="p-0">
              {group.topics.map((topic) => (
                <div key={topic.topic} className="border-b border-hairline last:border-b-0">
                  <h3 className="px-6 pb-2 pt-4 text-[15px] font-bold text-graphite">{topic.topic}</h3>
                  <ul className="divide-y divide-hairline">
                    {topic.items.map((m) => {
                      const number = numberOf.get(m.id) ?? 1;
                      return (
                        <li key={m.id}>
                          <details className="group">
                            <summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-3.5 hover:bg-mist [&::-webkit-details-marker]:hidden">
                              <span className="min-w-0 flex-1 truncate text-[15px]">{toPlainText(m.passage || m.prompt)}</span>
                              <span className="shrink-0 text-sm text-graphite">
                                Missed {m.timesWrong === 1 ? "once" : `${m.timesWrong} times`}
                              </span>
                            </summary>
                            <div className="border-t border-hairline bg-mist px-3 pb-5 pt-3 sm:px-5">
                              <MistakeRetry mistake={m} number={number} />
                            </div>
                          </details>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </Panel>
          </section>
        ))}
      </div>
    </>
  );
}
