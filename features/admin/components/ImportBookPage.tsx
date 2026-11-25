import { Suspense } from "react";
import { requireAdmin } from "@/features/auth";
import { createDbClient } from "@/core/db/server";
import { AdminTitle, LoadingBlock } from "./AdminShell";
import { ImportBook, type TopicOption } from "./ImportBook";

/** Admin: add a whole question book (an import file Claude prepares) to the topics. */
export function ImportBookPage() {
  return (
    <>
      <AdminTitle
        title="Import a book"
        subtitle="Adds a book’s questions and pictures to their topics in one go."
        back={{ href: "/admin", label: "Tests" }}
      />
      <Suspense fallback={<LoadingBlock />}>
        <Loader />
      </Suspense>
    </>
  );
}

async function Loader() {
  await requireAdmin();
  const supabase = await createDbClient();
  const { data, error } = await supabase
    .from("question_sets")
    .select("id, title, subject, published, modules(module_questions(count))")
    .eq("kind", "topic")
    .order("sort_order");
  if (error) throw new Error(`Could not load topics: ${error.message}`);
  const topics: TopicOption[] = data.map((s) => ({
    id: s.id,
    title: s.title,
    subject: s.subject,
    published: s.published,
    questions: s.modules.reduce((n, m) => n + (m.module_questions[0]?.count ?? 0), 0),
  }));
  return <ImportBook topics={topics} />;
}
