import { DevShell, PageTitle } from "@/core/shell";
import type { PracticeSetRow } from "../queries";
import { SetGroups } from "./PracticeSetList";

const row = (id: string, title: string, month: string, questions: number, extra: Partial<PracticeSetRow> = {}): PracticeSetRow => ({
  id, title, published: true, skill: null, area: null, areaOrder: 0, skillOrder: 0, month, questions, inProgressId: null, last: null, ...extra,
});

/** Local-only preview of the By month list with made-up sets. */
export function MonthlyPreview() {
  return (
    <DevShell>
      <PageTitle title="By month" subtitle="Reading and Writing: each month’s question set, newest first. Untimed, with an explanation after every answer." />
      <SetGroups
        subject="english"
        kind="monthly"
        sets={[
          row("1", "November set A", "2026-11-01", 20, { last: { correct: 14, finishedAt: "2026-11-20" } }),
          row("2", "November set B", "2026-11-01", 20, { inProgressId: "x" }),
          row("3", "October set", "2026-10-01", 25),
          row("4", "December set", "2026-12-01", 20, { published: false }),
        ]}
      />
    </DevShell>
  );
}
