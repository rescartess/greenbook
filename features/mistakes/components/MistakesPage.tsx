import { EmptyState } from "@/core/design/ui";
import { PageHeader } from "@/core/layout";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";

export function MistakesPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="Mistakes" subtitle={SUBJECTS[subject].name} />
      <EmptyState title="Mistakes arrives in milestone 10.">
        Every question you missed, waiting until you get it right twice.
      </EmptyState>
    </>
  );
}
