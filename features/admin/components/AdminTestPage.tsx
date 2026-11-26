import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Panel } from "@/core/design/ui";
import { Btn, BtnLink } from "@/core/shell";
import { SUBJECTS, isSubjectSlug } from "@/core/config/subjects";
import { requireAdmin } from "@/features/auth";
import { addModule } from "../actions";
import { getTest } from "../queries";
import { difficultyLabel, shorten } from "../schema";
import { AdminTitle, LoadingBlock } from "./AdminShell";
import { PublishTestButton } from "./PublishTestButton";
import { QuestionRowControls } from "./QuestionRowControls";

export function AdminTestPage({ setId }: { setId: Promise<string> }) {
  return (
    <Suspense fallback={<LoadingBlock height={480} />}>
      <TestDetail setId={setId} />
    </Suspense>
  );
}

async function TestDetail({ setId }: { setId: Promise<string> }) {
  await requireAdmin();
  const test = await getTest(await setId);
  if (!test) notFound();
  const subject = isSubjectSlug(test.subject)
    ? SUBJECTS[test.subject].name
    : test.subject;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AdminTitle
          back={{ href: "/admin", label: "All tests" }}
          title={test.title}
          subtitle={`${subject}. ${test.published ? "Published: students can see this test." : "Draft: students can’t see this test yet."}`}
        />
        <div className="mb-6">
          <PublishTestButton
            setId={test.id}
            published={test.published}
            problems={test.problems}
          />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        {test.modules.map((module) => (
          <Panel key={module.id} className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-3 pt-5">
              <div>
                <h2 className="text-[17px] font-bold">
                  {module.label}
                </h2>
                <p className="text-[15px] text-graphite">
                  {module.questions.length} questions
                  {module.minutes ? `, ${module.minutes} minutes` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <BtnLink href={`/admin/modules/${module.id}/import`} tone="quiet" className="h-9 px-3.5 text-[14px]">
                  Import
                </BtnLink>
                <BtnLink href={`/admin/modules/${module.id}/add`} className="h-9 px-3.5 text-[14px]">
                  Add question
                </BtnLink>
              </div>
            </div>
            {module.questions.length === 0 ? (
              <p className="border-t border-hairline px-6 py-6 text-[15px] text-graphite">
                No questions yet. Add them one by one or import a list.
              </p>
            ) : null}
            <ol className="divide-y divide-hairline border-t border-hairline">
              {module.questions.map((q, i) => (
                <li key={q.externalId} className="flex items-center hover:bg-mist">
                  <Link
                    href={`/admin/questions/${q.externalId}`}
                    className="grid min-w-0 flex-1 grid-cols-[2.25rem_1fr_auto] items-center gap-x-4 gap-y-1 py-3.5 pl-6 md:grid-cols-[2.25rem_1fr_13rem_5.5rem_4.5rem]"
                  >
                    <span className="font-bold tabular-nums text-graphite">
                      {q.position}
                    </span>
                    <span className="truncate text-[15px]">
                      {shorten(q.preview, 140)}
                    </span>
                    <span className="hidden truncate text-sm text-ink-soft md:block">
                      {q.skill}
                    </span>
                    <span className="hidden text-sm text-ink-soft md:block">
                      {difficultyLabel(q.difficulty)}
                    </span>
                    <span className="justify-self-end rounded-[6px] bg-pine-tint px-2 py-0.5 text-[13px] font-semibold text-pine">
                      {q.answer}
                    </span>
                  </Link>
                  <span className="hidden shrink-0 px-3 lg:block">
                    <QuestionRowControls
                      moduleId={module.id}
                      questionId={q.id}
                      first={i === 0}
                      last={i === module.questions.length - 1}
                    />
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        ))}
        {test.missingTiers.map((tier) => (
          <form
            key={tier}
            action={addModule.bind(null, test.id, tier)}
            className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-dashed border-control px-6 py-5"
          >
            <div>
              <p className="text-lg font-bold">Module 2 ({tier}) is missing</p>
              <p className="text-[15px] text-graphite">
                Students who do {tier === "easier" ? "less well" : "well"} on module 1 get this module.
              </p>
            </div>
            <Btn type="submit" tone="quiet">
              Add module 2 ({tier})
            </Btn>
          </form>
        ))}
      </div>
    </>
  );
}
