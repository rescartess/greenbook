import { notFound } from "next/navigation";
import { SUBJECTS } from "@/core/config/subjects";
import { PageTitle, Shell, SideNav } from "@/core/shell";
import type { DashboardData } from "../queries";
import { ColorSettings } from "@/features/profile";
import { DashboardView } from "./DashboardPage";

const SAMPLE: DashboardData = {
  resume: { title: "Boundaries", detail: "0 of 20 checked", progress: 0, done: 0, total: 20, href: "#" },
  score: {
    value: 230,
    first: 220,
    changeSinceFirst: 10,
    trend: [220, 230],
    latest: "Practice test 1, November 26",
    estimated: true,
    detail: "",
  },
  domains: [
    { name: "Information and Ideas", accuracy: 9, answered: 22 },
    { name: "Craft and Structure", accuracy: 11, answered: 18 },
    { name: "Expression of Ideas", accuracy: 0, answered: 9 },
    { name: "Standard English Conventions", accuracy: 14, answered: 21 },
  ],
  mistakeCount: 65,
  next: [
    { title: "Practice Expression of Ideas", detail: "Your weakest area right now, 0% correct", href: "#", primary: true },
    { title: "Review mistakes", detail: "65 questions waiting", href: "#" },
  ],
};

/** Local-only preview of the redesigned frame and dashboard with sample numbers. */
export function DashboardPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Shell nav={<SideNav user={{ name: "ravshanbekrahmonov91", initials: "RA", isAdmin: true }} badges={{ english: { mistakes: 65 } }} />}>
      <PageTitle title="Dashboard" subtitle={SUBJECTS.english.name} />
      <DashboardView subject="english" data={SAMPLE} design={<ColorSettings initial={{ main: null, background: null }} compact />} />
    </Shell>
  );
}
