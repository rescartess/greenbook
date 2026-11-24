import { EmptyState } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";

export function TopicsPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="Topics" subtitle={SUBJECTS[subject].name} />
      <EmptyState title="Topics arrives in milestone 6.">
        Practice sets for one skill at a time, grouped by the four official content areas.
      </EmptyState>
    </>
  );
}
