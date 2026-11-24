import { EmptyState } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";

export function ResultsPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="Results" subtitle={SUBJECTS[subject].name} />
      <EmptyState title="Results arrives in milestone 10.">
        Every attempt with its score and a question-by-question review.
      </EmptyState>
    </>
  );
}
