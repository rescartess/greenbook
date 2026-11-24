import { PageHeader } from "@/core/layout";
import { SUBJECTS, type SubjectSlug } from "@/core/config/subjects";
import { PracticeSetList } from "@/features/practice";

export function TopicsPage({ subject }: { subject: SubjectSlug }) {
  return (
    <>
      <PageHeader title="Topics" subtitle={SUBJECTS[subject].name} />
      <p className="-mt-2 mb-6 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
        Practice one skill at a time, untimed. Each answer is checked right away with an explanation.
      </p>
      <PracticeSetList subject={subject} kind="topic" />
    </>
  );
}
