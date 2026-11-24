import { AppShell } from "@/core/layout";
import { SUBJECT_SLUGS } from "@/core/config/subjects";
import { getCurrentUser } from "@/features/auth";
import { getMistakeCounts } from "@/features/mistakes";

export function generateStaticParams() {
  return SUBJECT_SLUGS.map((subject) => ({ subject }));
}

export default async function SubjectLayout({ children }: LayoutProps<"/[subject]">) {
  const [user, mistakes] = await Promise.all([getCurrentUser(), getMistakeCounts()]);
  const badges = { english: { mistakes: mistakes.english }, math: { mistakes: mistakes.math } };
  return (
    <AppShell user={user} badges={badges}>
      {children}
    </AppShell>
  );
}
