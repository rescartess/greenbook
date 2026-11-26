import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { PageTitle } from "@/core/shell";
import { PracticeSetList } from "@/features/practice";

export function MonthlyPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageTitle
        title="By month"
        subtitle={`${SUBJECTS[subject].name}: each month’s question set, newest first. Untimed, with an explanation after every answer.`}
      />
      <PracticeSetList subject={subject} kind="monthly" />
    </>
  );
}
