import { Suspense } from "react";
import { SQB_CREDIT } from "@/core/config/practice";
import type { SubjectSlug } from "@/core/config/subjects";
import { BtnLink, Card, CardSkeleton, Empty, PageTitle } from "@/core/shell";
import { toPlainText } from "@/core/question";
import { getMistakes } from "../queries";
import { groupByPractice, groupMistakes, type Mistake, type MistakePractice } from "../schema";
import { MistakeRetry } from "./MistakeRetry";

/** All mistakes from one practice (a topic or a test), to open and try again. */
export function MistakeSetPage({ subject, practiceKey }: { subject: SubjectSlug; practiceKey: Promise<string> }) {
  return (
    <Suspense fallback={<CardSkeleton className="h-96" />}>
      <Practice subject={subject} practiceKey={practiceKey} />
    </Suspense>
  );
}

async function Practice({ subject, practiceKey }: { subject: SubjectSlug; practiceKey: Promise<string> }) {
  const key = await practiceKey;
  const practice = groupByPractice(await getMistakes(subject)).find((p) => p.key === key);
  return <MistakeSetView subject={subject} practice={practice ?? null} />;
}

export function MistakeSetView({ subject, practice }: { subject: SubjectSlug; practice: MistakePractice | null }) {
  const back = { href: `/${subject}/mistakes`, label: "Mistakes" };
  if (!practice) {
    return (
      <>
        <PageTitle title="No mistakes left here" back={back} subjectSwitch={false} />
        <Empty title="Cleared." action={<BtnLink href={`/${subject}/mistakes`}>Back to Mistakes</BtnLink>}>
          Every one. Not bad.
        </Empty>
      </>
    );
  }
  const n = practice.items.length;
  return (
    <>
      <PageTitle
        title={practice.title}
        back={back}
        subjectSwitch={false}
        subtitle={`${practice.label}. ${n} left. Right twice and they’re gone.`}
      />
      <MistakeQuestions list={practice.items} />
      {practice.collection === "sqb" ? <p className="mt-8 max-w-2xl text-[13px] text-graphite">{SQB_CREDIT}</p> : null}
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
          <h2 className="mb-3 text-[17px] font-bold">{group.area}</h2>
          <Card flush className="overflow-hidden">
            {group.topics.map((topic) => (
              <div key={topic.topic} className="border-b border-hairline last:border-b-0">
                <h3 className="px-5 pb-2 pt-4 text-[14px] font-semibold text-graphite sm:px-6">{topic.topic}</h3>
                <ul className="divide-y divide-hairline">
                  {topic.items.map((m) => (
                    <li key={m.id}>
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-3.5 hover:bg-mist sm:px-6 [&::-webkit-details-marker]:hidden">
                          <span className="w-7 shrink-0 text-[14px] font-semibold tabular-nums text-graphite">
                            {numberOf.get(m.id)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[15px]">{toPlainText(m.passage || m.prompt)}</span>
                          <span className="shrink-0 text-[13px] text-graphite tabular-nums">
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
          </Card>
        </section>
      ))}
    </div>
  );
}
