import { Suspense } from "react";
import { AppShell, SideNav, SideNavPlaceholder } from "@/core/layout";
import { SUBJECT_SLUGS } from "@/core/config/subjects";
import { getCurrentUser, signOut } from "@/features/auth";
import { getMistakeCounts } from "@/features/mistakes";

export function generateStaticParams() {
  return SUBJECT_SLUGS.map((subject) => ({ subject }));
}

async function SignedInNav() {
  const [user, mistakes] = await Promise.all([getCurrentUser(), getMistakeCounts()]);
  const badges = { english: { mistakes: mistakes.english }, math: { mistakes: mistakes.math } };
  return <SideNav user={{ ...user, isAdmin: user.role === "admin" }} badges={badges} signOutAction={signOut} />;
}

export default function SubjectLayout({ children }: LayoutProps<"/[subject]">) {
  return (
    <AppShell
      nav={
        <Suspense fallback={<SideNavPlaceholder />}>
          <SignedInNav />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
