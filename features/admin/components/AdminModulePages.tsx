import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/features/auth";
import { addQuestion } from "../actions";
import { getModuleInfo, listSkills } from "../queries";
import { AdminTitle, LoadingBlock } from "./AdminShell";
import { ImportForm } from "./ImportForm";
import { NewTestForm } from "./NewTestForm";
import { QuestionEditor } from "./QuestionEditor";

export function AdminNewTestPage() {
  return (
    <>
      <AdminTitle back={{ href: "/admin", label: "All tests" }} title="New test or practice set" />
      <Suspense fallback={<LoadingBlock />}>
        <NewTestWithSkills />
      </Suspense>
    </>
  );
}

async function NewTestWithSkills() {
  await requireAdmin();
  const [english, math] = await Promise.all([listSkills("english"), listSkills("math")]);
  return <NewTestForm skills={{ english, math }} />;
}

export function AdminAddQuestionPage({ moduleId }: { moduleId: Promise<string> }) {
  return (
    <Suspense fallback={<LoadingBlock height={640} />}>
      <AddQuestion moduleId={moduleId} />
    </Suspense>
  );
}

async function AddQuestion({ moduleId }: { moduleId: Promise<string> }) {
  await requireAdmin();
  const mod = await getModuleInfo(await moduleId);
  if (!mod) notFound();
  const skills = await listSkills(mod.subject);
  const back = `/admin/tests/${mod.setId}`;
  return (
    <>
      <AdminTitle back={{ href: back, label: mod.testTitle }} title={`Add a question to ${mod.label}`} subtitle={`It becomes question ${mod.count + 1}.`} />
      <QuestionEditor
        number={mod.count + 1}
        cancelHref={back}
        skills={skills}
        action={addQuestion.bind(null, mod.id)}
        showStatus={false}
        submitLabel="Add question"
        initial={{ passage: "", prompt: "", choices: {}, correct: "", explanation: "", skillId: null, difficulty: "medium", status: "draft" }}
      />
    </>
  );
}

export function AdminImportPage({ moduleId }: { moduleId: Promise<string> }) {
  return (
    <Suspense fallback={<LoadingBlock height={480} />}>
      <Import moduleId={moduleId} />
    </Suspense>
  );
}

async function Import({ moduleId }: { moduleId: Promise<string> }) {
  await requireAdmin();
  const mod = await getModuleInfo(await moduleId);
  if (!mod) notFound();
  const back = `/admin/tests/${mod.setId}`;
  return (
    <>
      <AdminTitle
        back={{ href: back, label: mod.testTitle }}
        title={`Import questions into ${mod.label}`}
        subtitle={mod.count ? `They’re added after the ${mod.count} questions already there.` : "The module is empty, so they start at question 1."}
      />
      <ImportForm moduleId={mod.id} moduleLabel={mod.label} backHref={back} />
    </>
  );
}
