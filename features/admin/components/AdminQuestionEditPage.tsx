import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/core/design/ui";
import { requireAdmin } from "@/features/auth";
import { saveQuestion } from "../actions";
import { getQuestionPreview, listSkills } from "../queries";
import { AdminTitle, LoadingBlock } from "./AdminShell";
import { QuestionEditor } from "./QuestionEditor";

export function AdminQuestionEditPage({
  externalId,
}: {
  externalId: Promise<string>;
}) {
  return (
    <Suspense fallback={<LoadingBlock height={640} />}>
      <EditQuestion externalId={externalId} />
    </Suspense>
  );
}

async function EditQuestion({ externalId }: { externalId: Promise<string> }) {
  await requireAdmin();
  const q = await getQuestionPreview(await externalId);
  if (!q) notFound();
  const previewHref = `/admin/questions/${q.externalId}`;
  const title = q.place ? `Edit question ${q.place.position}` : "Edit question";
  const subtitle = q.place
    ? `${q.place.testTitle}, ${q.place.moduleLabel}`
    : q.externalId;

  if (q.type !== "mcq") {
    return (
      <>
        <AdminTitle
          back={{ href: previewHref, label: "Back to the question" }}
          title={title}
          subtitle={subtitle}
        />
        <EmptyState title="Typed-answer questions can’t be edited here yet">
          They will be when Math questions arrive.
        </EmptyState>
      </>
    );
  }

  const skills = await listSkills(q.subject);
  return (
    <>
      <AdminTitle
        back={{ href: previewHref, label: "Back to the question" }}
        title={title}
        subtitle={subtitle}
      />
      <QuestionEditor
        number={q.place?.position ?? 1}
        cancelHref={previewHref}
        skills={skills}
        action={saveQuestion.bind(null, q.externalId)}
        initial={{
          passage: q.content.passage ?? "",
          prompt: q.content.prompt,
          choices: Object.fromEntries(
            q.content.choices.map((c) => [c.id, c.text]),
          ),
          correct: q.correctId ?? "",
          explanation: q.explanation ?? "",
          skillId: q.skillId,
          difficulty: q.difficulty,
          status: q.status,
        }}
      />
    </>
  );
}
