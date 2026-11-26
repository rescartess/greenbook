import { notFound } from "next/navigation";
import { Shell, SideNav } from "@/core/shell";
import { lastSevenDays } from "../schema";
import { ProfileView } from "./ProfilePage";

/** Local-only preview of the profile page with sample numbers. */
export function ProfilePreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const week = lastSevenDays(new Date("2026-11-26T12:00:00Z")).map((day, i) => ({ day, practiced: [0, 1, 3, 4].includes(i) }));
  return (
    <Shell nav={<SideNav user={{ name: "Ravshanbek", initials: "RA", isAdmin: true }} badges={{ english: { mistakes: 65 } }} />}>
      <header className="mb-7">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em] sm:text-[32px]">Profile</h1>
        <p className="mt-1 text-[15px] text-graphite">Your name, goal and settings</p>
      </header>
      <ProfileView
        profile={{
          name: "Ravshanbek", initials: "RA", email: "ravshanbekrahmonov91@gmail.com", role: "admin", target: 1400,
          memberSince: "November 24, 2026", stats: { answered: 312, cleared: 18, fullTests: 2 }, week,
        }}
      />
    </Shell>
  );
}
