import { Suspense } from "react";
import { Shell, SideNav, SideNavPlaceholder, UserColorsStyle } from "@/core/shell";
import { SUBJECT_SLUGS } from "@/core/config/subjects";
import { getCurrentUser, signOut } from "@/features/auth";
import { getMistakeCounts } from "@/features/mistakes";
import { getLook } from "@/features/profile";

export function generateStaticParams() {
  return SUBJECT_SLUGS.map((subject) => ({ subject }));
}

async function SignedInNav() {
  const [user, mistakes, look] = await Promise.all([getCurrentUser(), getMistakeCounts(), getLook()]);
  const badges = { english: { mistakes: mistakes.english }, math: { mistakes: mistakes.math } };
  return (
    <>
      <UserColorsStyle {...look.colors} />
      <SideNav user={{ ...user, isAdmin: user.role === "admin", avatarUrl: look.avatarUrl }} badges={badges} signOutAction={signOut} />
    </>
  );
}

export default function SubjectLayout({ children }: LayoutProps<"/[subject]">) {
  return (
    <Shell
      nav={
        <Suspense fallback={<SideNavPlaceholder />}>
          <SignedInNav />
        </Suspense>
      }
    >
      {children}
    </Shell>
  );
}
