import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Panel } from "@/core/design/ui";
import { SUBJECTS, isSubjectSlug } from "@/core/config/subjects";
import { requireAdmin } from "@/features/auth";
import { getTest } from "../queries";
import { difficultyLabel, shorten } from "../schema";
import { AdminTitle, LoadingBlock } from "./AdminShell";
import { PublishTestButton } from "./PublishTestButton";

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
          <Panel key={module.label} className="p-0">
            <div className="flex items-baseline justify-between gap-4 px-6 pb-3 pt-5">
              <h2 className="text-xl font-extrabold tracking-tight">
                {module.label}
              </h2>
              <p className="text-[15px] text-graphite">
                {module.questions.length} questions
                {module.minutes ? `, ${module.minutes} minutes` : ""}
              </p>
            </div>
            <ol className="divide-y divide-hairline border-t border-hairline">
              {module.questions.map((q) => (
                <li key={q.externalId}>
                  <Link
                    href={`/admin/questions/${q.externalId}`}
                    className="grid grid-cols-[2.25rem_1fr_auto] items-center gap-x-4 gap-y-1 px-6 py-3.5 hover:bg-mist md:grid-cols-[2.25rem_1fr_13rem_5.5rem_4.5rem]"
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
                    <span className="justify-self-end rounded-full bg-pine-tint px-2.5 py-0.5 text-sm font-bold text-pine">
                      {q.answer}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </Panel>
        ))}
      </div>
    </>
  );
}
