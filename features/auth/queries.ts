import "server-only";
import { redirect } from "next/navigation";
import { AUTH_ENABLED } from "@/core/config/supabase";
import { createDbClient } from "@/core/db/server";

export type CurrentUser = { id: string; name: string; initials: string; role: "student" | "admin" };

const SAMPLE_USER: CurrentUser = { id: "sample", name: "Aziza Karimova", initials: "AK", role: "student" };

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

/**
 * The signed-in student, checked against Supabase on the server.
 * Sends signed-out visitors to /login. Must be called inside a <Suspense> boundary.
 * Until Supabase is connected it returns a sample student.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  if (!AUTH_ENABLED) return SAMPLE_USER;

  const supabase = await createDbClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", userId)
    .single();

  const email = typeof data?.claims?.email === "string" ? data.claims.email : "";
  const name = profile?.display_name || email.split("@")[0] || "Student";
  return { id: userId, name, initials: initialsOf(name), role: profile?.role === "admin" ? "admin" : "student" };
}
