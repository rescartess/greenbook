import { DevShell } from "@/core/shell";
import type { TopicDetail, TopicItem, TopicSummary } from "../schema";
import { TopicGrid, TopicsFrame } from "./TopicsPage";
import { TopicView } from "./TopicPage";

const T = (id: string, title: string, easy: number, medium: number, hard: number, done = 0, open = 0): TopicSummary => ({
  id, title, description: null, published: true, counts: { easy, medium, hard }, total: easy + medium + hard, done, open,
});

/** Local-only previews of the topics pages with made-up numbers. */
export function TopicsPreview() {
  const topics = [
    T("1", "Central Ideas and Details", 40, 52, 31, 37),
    T("2", "Command of Evidence", 38, 60, 44, 0, 1),
    T("3", "Inferences", 22, 41, 39, 12),
    T("4", "Words in Context", 55, 48, 40),
    T("5", "Text Structure and Purpose", 30, 34, 21),
    T("6", "Cross-Text Connections", 12, 18, 15),
    T("7", "Rhetorical Synthesis", 26, 39, 30, 95),
    T("8", "Transitions", 44, 50, 36),
    T("9", "Boundaries", 33, 40, 37, 20, 1),
    T("10", "Form, Structure, and Sense", 0, 0, 0),
  ];
  return (
    <DevShell>
      <TopicsFrame subject="english" collection="books">
        <TopicGrid subject="english" topics={topics} />
      </TopicsFrame>
    </DevShell>
  );
}

export function TopicPreview() {
  const items: TopicItem[] = Array.from({ length: 110 }, (_, i) => ({
    level: i < 33 ? "easy" : i < 73 ? "medium" : "hard",
    result: i < 14 ? (i % 4 === 0 ? "wrong" : "correct") : null,
  }));
  const topic: TopicDetail = {
    id: "9", title: "Boundaries", description: null, subject: "english", published: true, collection: "books", items,
    open: [{ attemptId: "x", difficulty: "easy", from: 21, to: 30, checkMode: "each", answered: 3, total: 10 }],
  };
  async function startAction() {
    "use server";
    return { message: null };
  }
  return (
    <DevShell>
      <TopicView subject="english" topic={topic} startAction={startAction} />
    </DevShell>
  );
}
