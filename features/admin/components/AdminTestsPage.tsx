import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, Panel } from "@/core/design/ui";
import { SUBJECTS, isSubjectSlug } from "@/core/config/subjects";
import { requireAdmin } from "@/features/auth";
import { listTests } from "../queries";
import { AdminTitle, LoadingBlock } from "./AdminShell";

export function AdminTestsPage() {
  return (
    <>
      <AdminTitle
        title="Tests"
        subtitle="Everything you have added, including drafts students can’t see yet."
      />
      <Suspense fallback={<LoadingBlock />}>
        <TestsList />
      </Suspense>
    </>
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
                    ? "rounded-full bg-pine px-3 py-1 text-sm font-bold text-pine-ink"
                    : "rounded-full bg-wash px-3 py-1 text-sm font-bold text-ink-soft"
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
