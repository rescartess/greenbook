import { notFound } from "next/navigation";
import { SUBJECTS } from "@/core/config/subjects";
import { PageTitle, Shell, SideNav } from "@/core/shell";
import type { DashboardData } from "../queries";
import { BioEditor, ColorSettings } from "@/features/profile";
import { ProfileBanner } from "./ProfileBanner";
import { DashboardView } from "./DashboardPage";
import { RankingCard } from "./RankingCard";

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

const SAMPLE_BOARD = {
  students: 41,
  rows: [
    ["Madina Yusupova", 412000, 1520],
    ["Timur Aliev", 301500, 1460],
    ["rescartess", 232184, 610],
    ["Dilnoza R.", 190200, 1390],
    ["Sardor Yakubov", 150900, null],
    ["Aziza Karimova", 120400, 1310],
    ["Jasur", 90100, null],
    ["Kamila T.", 60000, 1250],
  ].map(([name, seconds, best], i) => ({
    id: `00000000-0000-4000-8000-00000000000${i}`,
    rank: i + 1,
    name: name as string,
    avatarUrl: null,
    seconds: seconds as number,
    answered: Math.round((seconds as number) / 25),
    correct: Math.round((seconds as number) / 36),
    bestScore: best as number | null,
    me: i === 2,
  })),
};

/** Local-only preview of the redesigned frame and dashboard with sample numbers. */
export function DashboardPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Shell nav={<SideNav user={{ name: "ravshanbekrahmonov91", initials: "RA", isAdmin: true }} badges={{ english: { mistakes: 65 } }} />}>
      <PageTitle title="Dashboard" subtitle={SUBJECTS.english.name} />
      <DashboardView subject="english" data={SAMPLE} roast="1500+ is the only way to get her. Grind!"
        ranking={<RankingCard subject="english" board={SAMPLE_BOARD} />}
        top={
          <ProfileBanner
            subjectLabel="English"
            name="rescartess"
            initials="RA"
            avatarUrl={null}
            score={SAMPLE.score}
            banner={{ joined: "2026-11-24T10:00:00Z", bio: "Faster than the speed of light.", correct: 6450, seconds: 232184, answered: 9010, bestScore: 610, rank: 3, students: 41 }}
            bio={<BioEditor initial="Faster than the speed of light." />}
          />
        }
        design={<ColorSettings initial={{ main: null, background: null }} compact />} />
    </Shell>
  );
}
