import { EmptyState } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";

export function MonthlyPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="By month" subtitle={SUBJECTS[subject].name} />
      <EmptyState title="By month arrives in milestone 11.">
        Each month’s question set in one place, newest first.
      </EmptyState>
    </>
  );
}
