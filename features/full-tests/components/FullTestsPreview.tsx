import { DevShell } from "@/core/shell";
import type { FullTestRow } from "../queries";
import { FullTestList, FullTestsFrame } from "./FullTestsPage";

/** Local-only preview of Full tests with made-up rows. */
export function FullTestsPreview() {
  const tests: FullTestRow[] = [
    { id: "1", title: "Practice test 1", published: true, questions: 54, minutes: 64, inProgressId: null, last: { attemptId: "a", score: 560, raw: 31, finishedAt: "2026-11-26" } },
    { id: "2", title: "Practice test 2", published: true, questions: 54, minutes: 64, inProgressId: "b", last: null },
    { id: "3", title: "Practice test 3", published: true, questions: 54, minutes: 64, inProgressId: null, last: null },
    { id: "4", title: "Practice test 4", published: false, questions: 27, minutes: 32, inProgressId: null, last: null },
  ];
  return (
    <DevShell>
      <FullTestsFrame subject="english">
        <FullTestList subject="english" tests={tests} />
      </FullTestsFrame>
    </DevShell>
  );
}
