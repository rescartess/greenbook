import { PageHeader } from "@/core/layout";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { PracticeSetList } from "@/features/practice";

export function MonthlyPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="By month" subtitle={SUBJECTS[subject].name} />
      <p className="-mt-2 mb-6 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
        Each month’s question set in one place, newest first. Untimed, with an explanation after every answer.
      </p>
      <PracticeSetList subject={subject} kind="monthly" />
    </>
  );
}
