import { Suspense } from "react";
import { requireAdmin } from "@/features/auth";
import { agoLabel, dateLabel, timeLabel } from "../student-format";
import { listStudents } from "../students";
import { AdminTitle, LoadingBlock } from "./AdminShell";
import { StatTile } from "./StudentAvatar";
import { StudentsTable } from "./StudentsTable";

/** /admin/students: totals on top, then everyone with search and sort. */
export function StudentsPage() {
  return (
    <>
      <AdminTitle title="Students" subtitle="Everyone who has signed in. Tap a name to see more." />
      <Suspense fallback={<LoadingBlock height={520} />}>
        <Students />
      </Suspense>
    </>
  );
}

async function Students() {
  await requireAdmin();
  const { totals, rows } = await listStudents();
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Students" value={String(totals.students)} note={totals.newThisWeek ? `+${totals.newThisWeek} this week` : "No one new this week"} />
        <StatTile label="Active today" value={String(totals.activeToday)} note={`${totals.activeWeek} this week`} />
        <StatTile label="Time practicing" value={timeLabel(totals.seconds)} note="All students together" />
        <StatTile label="Questions answered" value={totals.answered.toLocaleString("en-US")} note="All students together" />
      </div>
      <StudentsTable
        rows={rows.map((r) => ({ ...r, lastActiveLabel: agoLabel(r.lastActive), joinedLabel: dateLabel(r.joined) }))}
      />
    </>
  );
}
