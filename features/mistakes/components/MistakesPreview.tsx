import { DevShell } from "@/core/shell";
import { groupByPractice, type Mistake } from "../schema";
import { MistakesView } from "./MistakesPage";
import { MistakeSetView } from "./MistakeSetPage";

const sample = (i: number, setId: string, setTitle: string, setKind: string, domain: string, skill: string): Mistake => ({
  id: `m${i}`, passage: `Made-up passage ${i} for the preview: researchers studied how desert ants find their way home.`, image: null,
  prompt: "Which choice completes the text?", choices: [{ id: "A", text: "first" }, { id: "B", text: "second" }],
  type: "mcq", skill, domain, timesWrong: 1 + (i % 3), streak: 0, setId, setTitle, setKind, collection: "books",
});

const LIST: Mistake[] = [
  ...Array.from({ length: 7 }, (_, i) => sample(i, "s1", "Boundaries", "topic", "Standard English Conventions", "Boundaries")),
  ...Array.from({ length: 4 }, (_, i) => sample(10 + i, "s2", "Practice test 1", "full_test", i % 2 ? "Craft and Structure" : "Information and Ideas", i % 2 ? "Words in Context" : "Inferences")),
  sample(20, "s3", "Transitions", "topic", "Expression of Ideas", "Transitions"),
];

/** Local-only previews of Mistakes with made-up questions. */
export function MistakesPreview() {
  return (
    <DevShell>
      <MistakesView subject="english" list={LIST} />
    </DevShell>
  );
}

export function MistakeSetPreview() {
  return (
    <DevShell>
      <MistakeSetView subject="english" practice={groupByPractice(LIST).find((p) => p.title === "Practice test 1") ?? null} />
    </DevShell>
  );
}
