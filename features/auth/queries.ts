import type { ShellUser } from "@/core/layout";

/**
 * The signed-in student.
 * SAMPLE until milestone 2, when this reads the real Supabase session.
 */
export async function getCurrentUser(): Promise<ShellUser> {
  return { name: "Aziza Karimova", initials: "AK" };
}
