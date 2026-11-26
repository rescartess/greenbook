import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink, EmptyState, Panel } from "@/core/design/ui";
import { SUBJECTS, isSubjectSlug } from "@/core/config/subjects";
import { requireAdmin } from "@/features/auth";
import { getInviteCode, listTests } from "../queries";
import { InviteCodeForm } from "./InviteCodeForm";
import { AdminTitle, LoadingBlock } from "./AdminShell";

export function AdminTestsPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AdminTitle
          title="Tests"
          subtitle="Everything you have added, including drafts students can’t see yet."
        />
        <div className="mb-6 flex gap-2">
          <ButtonLink href="/admin/import" variant="quiet">
            Import a book
          </ButtonLink>
          <ButtonLink href="/admin/tests/new">New test or set</ButtonLink>
        </div>
      </div>
      <Suspense fallback={<LoadingBlock />}>
        <TestsList />
      </Suspense>
      <Suspense fallback={null}>
        <InviteCode />
      </Suspense>
    </>
  );
}

async function InviteCode() {
  await requireAdmin();
  const code = await getInviteCode();
  return (
    <Panel className="mt-8">
      <h2 className="text-[17px] font-bold">Student login</h2>
      <p className="mb-4 mt-1 text-[15px] text-graphite">
        Students log in with their email and this code. Anyone with the code can make an account, so change it if it
        spreads.
      </p>
      <InviteCodeForm code={code} />
    </Panel>
  );
}

async function TestsList() {
  await requireAdmin();
  const tests = await listTests();
  if (tests.length === 0)
    return (
      <EmptyState title="No tests yet">
        Tests you add will appear here.
      </EmptyState>
    );

  return (
    <Panel className="p-0">
      <ul className="divide-y divide-hairline">
        {tests.map((test) => (
          <li key={test.id}>
            <Link
              href={`/admin/tests/${test.id}`}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-5 hover:bg-mist"
            >
              <div className="min-w-48 flex-1">
                <p className="text-lg font-bold">{test.title}</p>
                <p className="text-[15px] text-graphite">
                  {test.kindLabel},{" "}
                  {isSubjectSlug(test.subject)
                    ? SUBJECTS[test.subject].name
                    : test.subject}
                </p>
              </div>
              <p className="text-[15px] text-ink-soft">
                {test.modules.map((m) => `${m.label}: ${m.count}`).join(", ")}
              </p>
              <span
                className={
                  test.published
                    ? "rounded-[6px] bg-pine-tint px-2 py-0.5 text-[13px] font-semibold text-pine"
                    : "rounded-[6px] bg-mist px-2 py-0.5 text-[13px] font-semibold text-ink-soft"
                }
              >
                {test.published ? "Published" : "Draft"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
