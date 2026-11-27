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

export function MathTopicsPreview() {
  const names = [
    "Linear Equations in One Variable", "Linear Equations in Two Variables", "Linear Functions",
    "Systems of Two Linear Equations in Two Variables", "Linear Inequalities in One or Two Variables", "Nonlinear Functions",
    "Nonlinear Equations in One Variable and Systems of Equations in Two Variables", "Equivalent Expressions", "Percentages",
    "Ratios, Rates, Proportional Relationships, and Units", "One-Variable Data: Distributions and Measures of Center and Spread",
    "Two-Variable Data: Models and Scatterplots", "Probability and Conditional Probability",
    "Inference from Sample Statistics and Margin of Error", "Evaluating Statistical Claims: Observational Studies and Experiments",
    "Area and Volume", "Lines, Angles, and Triangles", "Right Triangles and Trigonometry", "Circles",
  ];
  const topics = names.map((n, i) => T(`m${i}`, n, 10 + ((i * 7) % 20), 8 + ((i * 5) % 25), (i * 11) % 40, i % 4 === 0 ? 9 : 0));
  return (
    <DevShell>
      <TopicsFrame subject="math" collection="books">
        <TopicGrid subject="math" topics={topics} />
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
