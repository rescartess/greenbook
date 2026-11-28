import { DevShell } from "@/core/shell";
import type { FullTestRow } from "../queries";
import { FullTestList, FullTestsFrame } from "./FullTestsPage";

const P = { module1: { questions: 27, minutes: 32 }, harder: { questions: 27, minutes: 32 }, easier: { questions: 27, minutes: 32 } };

/** Local-only preview of Full tests with made-up rows. */
export function FullTestsPreview() {
  const tests: FullTestRow[] = [
    { id: "s", title: "2025 September adaptive", adaptive: true, month: "2025-09-01", published: true, questions: 54, minutes: 64, moduleNames: ["Module 1", "Module 2 Hard"], parts: P, inProgressId: null, last: { attemptId: "x", score: 640, raw: 41, finishedAt: "2026-11-26" } },
    { id: "o", title: "2025 October adaptive", adaptive: true, month: "2025-10-01", published: true, questions: 54, minutes: 64, moduleNames: ["Module 1", "Module 2 Hard"], parts: P, inProgressId: null, last: null },
    { id: "1", title: "2025 September A", adaptive: false, month: "2025-09-01", published: true, questions: 54, minutes: 64, moduleNames: ["Module 1", "Module 2 Hard"], parts: P, inProgressId: null, last: { attemptId: "a", score: 560, raw: 31, finishedAt: "2026-11-26" } },
    { id: "2", title: "2025 September B", adaptive: false, month: "2025-09-01", published: true, questions: 54, minutes: 64, moduleNames: ["Module 1", "Module 2 Hard"], parts: P, inProgressId: "b", last: null },
    { id: "3", title: "2025 October A", adaptive: false, month: "2025-10-01", published: true, questions: 54, minutes: 64, moduleNames: ["Module 1", "Module 2 Hard"], parts: P, inProgressId: null, last: null },
    { id: "j", title: "2024 June adaptive", adaptive: true, month: "2024-06-01", published: true, questions: 54, minutes: 64, moduleNames: ["Module 1", "Module 2 Hard"], parts: P, inProgressId: null, last: null },
    { id: "5", title: "2024 June A", adaptive: false, month: "2024-06-01", published: true, questions: 54, minutes: 64, moduleNames: ["Module 1", "Module 2 Hard"], parts: P, inProgressId: null, last: null },
    { id: "4", title: "2025 October B", adaptive: false, month: "2025-10-01", published: false, questions: 54, minutes: 64, moduleNames: ["Module 1", "Module 2 Hard"], parts: P, inProgressId: null, last: null },
  ];
  return (
    <DevShell>
      <FullTestsFrame subject="english">
        <FullTestList subject="english" tests={tests} />
      </FullTestsFrame>
    </DevShell>
  );
}
