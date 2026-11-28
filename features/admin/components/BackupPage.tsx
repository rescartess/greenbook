import { Suspense } from "react";
import { requireAdmin } from "@/features/auth";
import { AdminTitle, LoadingBlock } from "./AdminShell";
import { BackupPanel } from "./BackupPanel";

/** Admin: download a backup of every question (owner request 28 Nov 2026). */
export function BackupPage() {
  return (
    <>
      <AdminTitle title="Backup" subtitle="Every question in one file. Keep it somewhere safe." />
      <Suspense fallback={<LoadingBlock height={180} />}>
        <Guarded />
      </Suspense>
    </>
  );
}

async function Guarded() {
  await requireAdmin();
  return <BackupPanel />;
}
