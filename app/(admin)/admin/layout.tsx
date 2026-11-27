import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/features/admin";
import { ProfileStyle } from "@/features/profile";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | FreedomPrep admin" }, robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminShell>
      <Suspense>
        <ProfileStyle />
      </Suspense>
      {children}
    </AdminShell>
  );
}
