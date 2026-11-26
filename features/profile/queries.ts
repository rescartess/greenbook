import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AUTH_ENABLED } from "@/core/config/supabase";
import { createDbClient } from "@/core/db/server";
import { avatarUrl } from "@/core/shell";
import { lastSevenDays } from "./schema";

export type Profile = {
  name: string;
  initials: string;
  email: string;
  role: "student" | "admin";
  target: number | null;
  memberSince: string | null;
  stats: { answered: number; cleared: number; fullTests: number };
  colors: { main: string | null; background: string | null };
  avatarUrl: string | null;
  testDate: string | null;
  today: string;
  /** One entry per day for the last 7 days, oldest first: did the student start any practice or test? */
  week: { day: string; practiced: boolean }[];
};

const dateText = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

/** The signed-in student's profile and a few numbers from what they have done so far. */
export async function getProfile(): Promise<Profile> {
  await connection(); // per-visit page: "today" must be the visit's day, not the build's
  const days = lastSevenDays(new Date());
  if (!AUTH_ENABLED) {
    return {
      name: "Aziza Karimova", initials: "AK", email: "aziza@example.com", role: "student", target: 1400,
      memberSince: null, stats: { answered: 0, cleared: 0, fullTests: 0 },
      colors: { main: null, background: null }, avatarUrl: null, testDate: null, today: days[6],
      week: days.map((day) => ({ day, practiced: false })),
    };
  }
  const supabase = await createDbClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const email = typeof claims?.claims?.email === "string" ? claims.claims.email : "";

  const [profile, answered, cleared, fullTests, recent] = await Promise.all([
    supabase.from("profiles").select("display_name, role, target_score, created_at, accent_color, background_color, avatar_path, test_date").eq("id", userId).single(),
    supabase.from("question_progress").select("question_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("question_progress").select("question_id", { count: "exact", head: true }).eq("user_id", userId).eq("mastered", true),
    supabase.from("attempts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("mode", "timed").eq("status", "completed"),
    supabase.from("attempts").select("started_at").eq("user_id", userId).gte("started_at", `${days[0]}T00:00:00Z`),
  ]);

  const name = profile.data?.display_name || email.split("@")[0] || "Student";
  const practicedDays = new Set((recent.data ?? []).map((a) => a.started_at.slice(0, 10)));
  return {
    name,
    initials: initialsOf(name),
    email,
    role: profile.data?.role === "admin" ? "admin" : "student",
    target: profile.data?.target_score ?? null,
    memberSince: profile.data?.created_at ? dateText(profile.data.created_at) : null,
    stats: { answered: answered.count ?? 0, cleared: cleared.count ?? 0, fullTests: fullTests.count ?? 0 },
    colors: { main: profile.data?.accent_color ?? null, background: profile.data?.background_color ?? null },
    avatarUrl: avatarUrl(profile.data?.avatar_path),
    testDate: profile.data?.test_date ?? null,
    today: days[6],
    week: days.map((day) => ({ day, practiced: practicedDays.has(day) })),
  };
}

export type Look = { colors: { main: string | null; background: string | null }; avatarUrl: string | null };

/** The signed-in student's colors and photo, for the menu and every page around the exam. */
export async function getLook(): Promise<Look> {
  const none: Look = { colors: { main: null, background: null }, avatarUrl: null };
  if (!AUTH_ENABLED) return none;
  const supabase = await createDbClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return none;
  const { data } = await supabase.from("profiles").select("accent_color, background_color, avatar_path").eq("id", userId).maybeSingle();
  return { colors: { main: data?.accent_color ?? null, background: data?.background_color ?? null }, avatarUrl: avatarUrl(data?.avatar_path) };
}
