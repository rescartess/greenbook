import { EmptyState } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";

export function FullTestsPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="Full tests" subtitle={SUBJECTS[subject].name} />
      <EmptyState title="Full tests arrives in milestone 8.">
        Adaptive full tests, one subject at a time: module 1, then an easier or harder module 2, scored 200 to 800.
      </EmptyState>
    </>
  );
}
